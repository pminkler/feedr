<script setup lang="ts">
import { computed } from "vue";
import { useAuth } from "~/composables/useAuth";
import { signOut } from "aws-amplify/auth";
import { useLocalePath, useRouter } from "#imports";
import { useI18n } from "vue-i18n";
import Logo from "~/components/Logo.vue";

const { t } = useI18n({ useScope: "local" });
const localePath = useLocalePath();
const router = useRouter();
const { currentUser } = useAuth();

async function onSignOut() {
  try {
    await signOut();
    router.push(localePath("/"));
  } catch (error) {
    console.error("Error signing out", error);
  }
}

const links = computed(() => {
  if (currentUser.value) {
    return [
      {
        label: t("header.home"),
        to: localePath("/recipes/bookmarked"),
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
        <div class="h-10">
          <Logo />
        </div>
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

<style scoped></style>

<i18n lang="json">
{
  "en": {
    "header": {
      "logo": "Feedr",
      "home": "Bookmarked Recipes",
      "signUp": "Sign Up",
      "signIn": "Sign In",
      "signOut": "Sign Out"
    }
  },
  "fr": {
    "header": {
      "logo": "Feedr",
      "home": "Recettes en favoris",
      "signUp": "S'inscrire",
      "signIn": "Se connecter",
      "signOut": "Se déconnecter"
    }
  },
  "es": {
    "header": {
      "logo": "Feedr",
      "home": "Recetas guardadas",
      "signUp": "Registrarse",
      "signIn": "Iniciar sesión",
      "signOut": "Cerrar sesión"
    }
  }
}
</i18n>
