<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useNuxtApp } from "#app";
import { useI18n } from "vue-i18n";

const switchLocalePath = useSwitchLocalePath();
const { locale, locales, t } = useI18n({ useScope: "local" });

const localePath = useLocalePath();

const { $pwa } = useNuxtApp();
const isPWAInstalled = ref(false);

onMounted(() => {
  isPWAInstalled.value = $pwa?.isPWAInstalled || false;
});

const installApp = async () => {
  if ($pwa?.install && !$pwa.isPWAInstalled) {
    await $pwa.install();
  }
};

const columns = [
  {
    label: t("footer.legal"),
    children: [
      {
        label: t("footer.privacyPolicyLink"),
        to: localePath("privacy"),
      },
      {
        label: t("footer.termsOfServiceLink"),
        to: localePath("terms"),
      },
    ],
  },
  {
    label: t("footer.tools"),
    children: [
      {
        label: isPWAInstalled.value
          ? t("footer.appInstalled")
          : t("footer.installAppLink"),
        click: installApp,
        disabled: isPWAInstalled.value,
      },
      {
        label: t("footer.bookmarkletLink"),
        to: localePath("bookmarklet"),
      },
    ],
  },
  {
    label: t("footer.contact"), // Column 3 Heading (now a group)
    children: [
      // Wrap the contact link in a children array
      {
        label: t("footer.contactLink"),
        to: localePath("contact"),
      },
    ],
  },
];

const availableLocales = computed(() => {
  return locales.value.map((i) => ({
    label: i.name,
    value: i.code,
  }));
});

const selectedLanguage = ref(locale.value);

const changeLanguage = (newLocale: "en" | "es" | "fr") => {
  window.location.href = switchLocalePath(newLocale);
};
</script>

<template>
  <USeparator class="h-px" />
  
  <UFooter :ui="{ top: 'border-t border-b border-(--ui-border)' }">
    <template #top>
      <UContainer>
        <UFooterColumns :columns="columns">
          <template #right>
            <USelect
              v-model="selectedLanguage"
              :items="availableLocales"
              @change="changeLanguage($event)"
            />
          </template>
        </UFooterColumns>
      </UContainer>
    </template>

    <template #left>
      <p class="text-sm text-(--ui-text-muted)">
        Copyright © {{ new Date().getFullYear() }}. All rights reserved.
      </p>
    </template>

    <template #right>
      <UColorModeButton size="sm" />
    </template>
  </UFooter>
</template>

<i18n lang="json">
{
  "en": {
    "footer": {
      "legal": "Legal",
      "privacyPolicyLink": "Privacy Policy",
      "termsOfServiceLink": "Terms of Service",
      "tools": "Tools",
      "installAppLink": "Add to Home Screen",
      "appInstalled": "Installed",
      "bookmarkletLink": "Bookmarklet",
      "contact": "Contact",
      "contactLink": "Contact Us"
    }
  },
  "fr": {
    "footer": {
      "legal": "Mentions légales",
      "privacyPolicyLink": "Politique de confidentialité",
      "termsOfServiceLink": "Conditions d'utilisation",
      "tools": "Outils",
      "installAppLink": "Ajouter à l'écran d'accueil",
      "appInstalled": "Installée",
      "bookmarkletLink": "Marque-page",
      "contact": "Contact",
      "contactLink": "Contactez-nous"
    }
  },
  "es": {
    "footer": {
      "legal": "Legal",
      "privacyPolicyLink": "Política de privacidad",
      "termsOfServiceLink": "Términos de servicio",
      "tools": "Herramientas",
      "installAppLink": "Añadir a la pantalla de inicio",
      "appInstalled": "Instalada",
      "bookmarkletLink": "Marcador",
      "contact": "Contacto",
      "contactLink": "Contáctenos"
    }
  }
}
</i18n>
