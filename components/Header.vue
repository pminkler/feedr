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
    router.push(localePath("index"));
  } catch (error) {
    console.error("Error signing out", error);
  }
}

const links = computed(() => {
  if (currentUser.value) {
    return [
      {
        label: t("header.myRecipes"),
        to: localePath("/my-recipes"),
        icon: "i-heroicons-document-text",
      },
      {
        label: t("header.mealPlanning"),
        to: localePath("/plans"),
        icon: "i-heroicons-calendar",
      },
    ];
  } else {
    return [];
  }
});
</script>

<template>
  <UHeader>
    <!-- Logo slot -->
    <template #left>
      <NuxtLink :to="localePath('index')">
        <div class="h-10">
          <Logo />
        </div>
      </NuxtLink>
    </template>

    <UNavigationMenu :items="links" />

    <!-- Right slot -->
    <template #right>
      <template v-if="!currentUser">
        <ULink :to="localePath('signup')">
          <UButton color="primary">{{ t("header.signUp") }}</UButton>
        </ULink>
        <NuxtLink :to="localePath('login')">
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
      "home": "My Recipes",
      "myRecipes": "My Recipes",
      "mealPlanning": "Meal Planning",
      "signUp": "Sign Up",
      "signIn": "Sign In",
      "signOut": "Sign Out"
    }
  },
  "fr": {
    "header": {
      "logo": "Feedr",
      "home": "Mes Recettes",
      "myRecipes": "Mes Recettes",
      "mealPlanning": "Planification",
      "signUp": "S'inscrire",
      "signIn": "Se connecter",
      "signOut": "Se déconnecter"
    }
  },
  "es": {
    "header": {
      "logo": "Feedr",
      "home": "Mis Recetas",
      "myRecipes": "Mis Recetas",
      "mealPlanning": "Planificación",
      "signUp": "Registrarse",
      "signIn": "Iniciar sesión",
      "signOut": "Cerrar sesión"
    }
  }
}
</i18n>
