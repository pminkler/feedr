<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { signOut } from 'aws-amplify/auth';
import { useI18n } from 'vue-i18n';
import { useRecipe } from '~/composables/useRecipe';
import AddRecipeModal from '~/components/AddRecipeModal.vue';

const { t } = useI18n({ useScope: 'local' });
const overlay = useOverlay();
const localePath = useLocalePath();
const router = useRouter();
const { currentUser } = useAuth();
const { myRecipesState, getMyRecipes } = useRecipe();

// State to track if a guest user has saved recipes
const guestHasSavedRecipes = ref(false);

// Check for guest recipes on component mount
onMounted(async () => {
  if (!currentUser.value) {
    try {
      // For guest users, check if they have any saved recipes
      const recipes = await getMyRecipes();
      guestHasSavedRecipes.value = recipes.length > 0;
    } catch (error) {
      console.error('Error checking for guest recipes:', error);
    }
  }
});

// Watch myRecipesState for changes to update guestHasSavedRecipes accordingly
watch(myRecipesState, (newRecipes) => {
  if (!currentUser.value && newRecipes) {
    guestHasSavedRecipes.value = newRecipes.length > 0;
  }
});

async function onSignOut() {
  try {
    await signOut();
    router.push(localePath('index'));
  } catch (error) {
    console.error('Error signing out', error);
  }
}

// Function to open recipe generation modal
function openRecipeGenerationModal() {
  overlay.create({
    component: AddRecipeModal,
  });
}

const links = computed(() => {
  // Show "Add Recipe" and "My Recipes" links
  if (currentUser.value || guestHasSavedRecipes.value) {
    return [
      {
        label: t('header.myRecipes'),
        to: localePath('/my-recipes'),
        icon: 'i-heroicons-document-text',
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
        <div class="h-10 flex flex-row items-center gap-2">
          <img
            src="/assets/images/feedr_icon_cropped.png"
            style="height: 100%; object-fit: contain"
          />
          <span class="text-2xl font-bold font-nunito text-primary-400 uppercase">Feedr</span>
        </div>
      </NuxtLink>
    </template>

    <UNavigationMenu :items="links" />

    <!-- Right slot -->
    <template #right>
      <template v-if="!currentUser">
        <ULink :to="localePath('signup')">
          <UButton color="primary">{{ t('header.signUp') }}</UButton>
        </ULink>
        <NuxtLink :to="localePath('login')">
          <UButton variant="ghost" color="primary" class="ml-2">
            {{ t('header.signIn') }}
          </UButton>
        </NuxtLink>
      </template>
      <template v-else>
        <UButton color="primary" variant="ghost" @click="onSignOut">
          {{ t('header.signOut') }}
        </UButton>
      </template>
    </template>

    <template #body>
      <UNavigationMenu :items="links" orientation="vertical" class="-mx-2.5" />
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
      "addRecipe": "Add Recipe",
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
      "addRecipe": "Ajouter une recette",
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
      "addRecipe": "Añadir receta",
      "signUp": "Registrarse",
      "signIn": "Iniciar sesión",
      "signOut": "Cerrar sesión"
    }
  }
}
</i18n>
