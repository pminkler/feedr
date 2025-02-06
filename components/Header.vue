<script setup lang="ts">
import { computed } from "vue";
import { useAuth } from "~/composables/useAuth";
import { signOut } from "aws-amplify/auth";
import { useLocalePath } from "#imports";
import { useI18n } from "vue-i18n";

const { t } = useI18n({ useScope: "local" });
const { currentUser } = useAuth();
const localePath = useLocalePath();

async function onSignOut() {
  try {
    await signOut();
  } catch (error) {
    console.error("Error signing out", error);
  }
}

const links = computed(() => {
  if (currentUser.value) {
    return [
      {
        label: t("header.home"),
        // Here we assume the link is a direct URL.
        // Alternatively, if UHeader supports an object with a "to" property,
        // you can set: to: localePath("/home")
        click: localePath("/home"),
      },
    ];
  } else {
    return [];
  }
});
</script>

<template>
  <UHeader :links="links">
    <!-- Logo slot -->
    <template #logo>
      <NuxtLink to="/">
        <span class="logo">{{ t("header.logo") }}</span>
      </NuxtLink>
    </template>

    <!-- Right slot -->
    <template #right>
      <template v-if="!currentUser">
        <NuxtLink :to="localePath('/signup')">
          <UButton color="primary">{{ t("header.signUp") }}</UButton>
        </NuxtLink>
        <NuxtLink :to="localePath('/login')">
          <UButton variant="ghost" color="primary" class="ml-2">
            {{ t("header.signIn") }}
          </UButton>
        </NuxtLink>
      </template>
      <template v-else>
        <UButton @click="onSignOut" color="primary" variant="ghost">
          {{ t("header.signOut") }}
        </UButton>
      </template>
    </template>
  </UHeader>
</template>

<style scoped>
.logo {
  font-family: Nunito;
  font-size: 1.25rem;
  font-weight: bold;
}

.ml-2 {
  margin-left: 0.5rem;
}
</style>

<i18n lang="json">
{
  "en": {
    "header": {
      "logo": "Feedr",
      "home": "Home",
      "signUp": "Sign Up",
      "signIn": "Sign In",
      "signOut": "Sign Out"
    }
  },
  "fr": {
    "header": {
      "logo": "Feedr",
      "home": "Accueil",
      "signUp": "S'inscrire",
      "signIn": "Se connecter",
      "signOut": "Se déconnecter"
    }
  },
  "es": {
    "header": {
      "logo": "Feedr",
      "home": "Inicio",
      "signUp": "Registrarse",
      "signIn": "Iniciar sesión",
      "signOut": "Cerrar sesión"
    }
  }
}
</i18n>
