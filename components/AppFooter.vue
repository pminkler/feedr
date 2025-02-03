<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useNuxtApp } from "#app";

const switchLocalePath = useSwitchLocalePath();
const { locale, locales } = useI18n();

const { t: $t } = useI18n();
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

const links = [
  {
    label: $t("footer.legal"),
    children: [
      {
        label: $t("footer.privacyPolicyLink"),
        to: localePath("/privacy"),
      },
      {
        label: $t("footer.termsOfServiceLink"),
        to: localePath("/terms"),
      },
    ],
  },
  {
    label: $t("footer.tools"),
    children: [
      {
        label: isPWAInstalled.value
          ? $t("footer.appInstalled")
          : $t("footer.installAppLink"),
        click: installApp,
        disabled: isPWAInstalled.value,
      },
      {
        label: $t("footer.bookmarkletLink"),
        to: localePath("/bookmarklet"),
      },
    ],
  },
  {
    label: $t("footer.contact"), // Column 3 Heading (now a group)
    children: [
      // Wrap the contact link in a children array
      {
        label: $t("footer.contactLink"),
        to: localePath("/contact"),
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

const changeLanguage = (newLocale: string) => {
  window.location.href = switchLocalePath(newLocale);
};
</script>

<template>
  <UFooter
    :ui="{
      top: {
        wrapper: 'border-t border-b border-gray-200 dark:border-gray-800',
      },
    }"
  >
    <template #top>
      <UFooterColumns :links="links">
        <template #right>
          <USelect
            v-model="selectedLanguage"
            :options="availableLocales"
            @change="changeLanguage($event)"
          />
        </template>
      </UFooterColumns>
    </template>

    <template #left>
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        Copyright © {{ new Date().getFullYear() }}. All rights reserved.
      </p>
    </template>

    <template #right>
      <UColorModeButton size="sm" />
    </template>
  </UFooter>
</template>
