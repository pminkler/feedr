<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import { useRecipe } from "~/composables/useRecipe";
import { generateClient } from "aws-amplify/data";
import { useI18n } from "vue-i18n";
import LoadingMessages from "~/components/LoadingMessages.vue";
import { useAuth } from "~/composables/useAuth";

// Assume you have a toast composable available
const toast = useToast();

// Create your AWS Amplify client (adjust Schema type as needed)
import type { Schema } from "~/amplify/data/resource";
const client = generateClient<Schema>();

const { t } = useI18n({ useScope: "local" });

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

// Recipe state and flags
const recipe = ref<any>(null);
const loading = ref(true);
const error = ref<any>(null);
const waitingForProcessing = ref(false);
const cookingMode = ref(false);

// Scaling state:
const scale = ref(1);
const desiredServings = ref<number>(1);

// Controls whether the configuration slideover is open
const isSlideoverOpen = ref(false);
// Which scaling method to use: "ingredients" or "servings"
const scalingMethod = ref<"ingredients" | "servings">("ingredients");

const recipeStore = useRecipe();
const { currentUser } = useAuth();

let subscription: { unsubscribe: () => void } | null = null;

// NEW: State to store the SavedRecipe (if any) for this recipe.
const savedRecipe = ref<any>(null);

// Fetch the recipe as before
const fetchRecipe = async () => {
  loading.value = true;
  error.value = null;
  const response = await recipeStore.getRecipeById(props.id);
  if (response && response.status === "SUCCESS") {
    recipe.value = response;
    loading.value = false;
  } else if (response && response.status === "FAILED") {
    recipe.value = response;
    loading.value = false;
  } else {
    waitingForProcessing.value = true;
  }
  // After fetching the recipe, if user is logged in, also query for a matching SavedRecipe.
  if (currentUser.value) {
    await fetchSavedRecipe();
  }
};

// NEW: Query for an existing SavedRecipe for this recipe and the current user.
const fetchSavedRecipe = async () => {
  try {
    const response = await client.models.SavedRecipe.list({
      filter: {
        recipeId: { eq: props.id },
      },
      authMode: "userPool",
    });
    // Assume only one record per user/recipe pair.
    if (response.data && response.data.length > 0) {
      savedRecipe.value = response.data[0];
    } else {
      savedRecipe.value = null;
    }
  } catch (err) {
    console.error("Error fetching saved recipe:", err);
  }
};

// Extract the first number from recipe.servings (if possible)
const originalServingsNumber = computed(() => {
  if (!recipe.value || !recipe.value.servings) return NaN;
  // If the servings string contains a range, ignore it for scaling-by-servings purposes
  if (/[–\-—]/.test(recipe.value.servings)) return NaN;
  const match = recipe.value.servings.match(/(\d+(\.\d+)?)/);
  if (match) {
    return parseFloat(match[0]);
  }
  return NaN;
});

const canScaleByServings = computed(() => !isNaN(originalServingsNumber.value));

watch(
  originalServingsNumber,
  (val) => {
    if (!isNaN(val)) {
      desiredServings.value = val;
    } else {
      scalingMethod.value = "ingredients";
    }
  },
  { immediate: true },
);

const scalingFactor = computed(() => {
  if (scalingMethod.value === "ingredients") {
    return scale.value;
  } else {
    const orig = originalServingsNumber.value;
    if (!isNaN(orig) && orig > 0) {
      return desiredServings.value / orig;
    }
    return 1;
  }
});

// Updated computed property: map over the ingredients and update each quantity.
const scaledIngredients = computed(() => {
  if (!recipe.value || !recipe.value.ingredients) return [];
  return recipe.value.ingredients.map((ingredient: any) => {
    // Assuming ingredient.quantity is a number. Adjust if it's a string.
    return {
      ...ingredient,
      quantity: ingredient.quantity * scalingFactor.value,
    };
  });
});

// When scaling by ingredients, multiply each distinct number in the servings string by the scale factor.
// When scaling by servings, simply display the desired servings value.
const scaledServingsText = computed(() => {
  if (!recipe.value || !recipe.value.servings) return "";
  if (scalingMethod.value === "servings") {
    return desiredServings.value.toString();
  }
  const factor = scale.value;
  return recipe.value.servings.replace(/(\d+(\.\d+)?)/g, (match) => {
    const num = parseFloat(match);
    const scaled = num * factor;
    return Number.isInteger(scaled) ? scaled.toString() : scaled.toFixed(1);
  });
});

const ingredientScaleLabel = computed(() => {
  const val = scale.value;
  if (val === 0.5) return t("recipe.configuration.scale.half");
  if (val === 1) return t("recipe.configuration.scale.full");
  if (val === 2) return t("recipe.configuration.scale.double");
  return t("recipe.configuration.scale.custom", { value: val });
});

// Concise label showing only the original serving size as a subtitle.
const servingsScaleLabel = computed(() => {
  const orig = originalServingsNumber.value;
  if (!isNaN(orig)) {
    return t("recipe.configuration.servings.original", { original: orig });
  }
  return "";
});

function shareRecipe() {
  if (!recipe.value) return;
  const shareData = {
    title: recipe.value.title,
    text: recipe.value.description || t("recipe.share.defaultText"),
    url: recipe.value.url,
  };

  if (navigator.share) {
    navigator
      .share(shareData)
      .then(() => {
        toast.add({
          id: "share-success",
          title: t("recipe.share.successTitle"),
          description: t("recipe.share.successDescription"),
          icon: "material-symbols:share",
          timeout: 3000,
        });
      })
      .catch((err) => {
        toast.add({
          id: "share-error",
          title: t("recipe.share.errorTitle"),
          description: t("recipe.share.errorDescription"),
          icon: "material-symbols:error",
          timeout: 3000,
        });
        console.error("Share failed:", err);
      });
  } else {
    navigator.clipboard
      .writeText(recipe.value.url)
      .then(() => {
        toast.add({
          id: "share-copied",
          title: t("recipe.share.copiedTitle"),
          description: t("recipe.share.copiedDescription"),
          icon: "material-symbols:share",
          timeout: 3000,
        });
      })
      .catch(() => {
        toast.add({
          id: "share-clipboard-error",
          title: t("recipe.share.clipboardErrorTitle"),
          description: t("recipe.share.clipboardErrorDescription"),
          icon: "material-symbols:error",
          timeout: 3000,
        });
      });
  }
}

const subscribeToChanges = async () => {
  if (subscription) {
    subscription.unsubscribe();
    subscription = null;
  }
  // Conditionally include authMode only if a user is logged in.
  const options = currentUser.value ? { authMode: "userPool" } : {};
  subscription = client.models.Recipe.onUpdate({
    filter: { id: { eq: props.id } },
    ...options,
  }).subscribe({
    next: (updatedRecipe) => {
      if (updatedRecipe.id === props.id) {
        recipe.value = updatedRecipe;
        loading.value = false;
        waitingForProcessing.value = false;
      }
    },
    error: (err) => console.error("Error subscribing to recipe updates:", err),
  });
};

onMounted(async () => {
  await fetchRecipe();
  await subscribeToChanges();
});

watch(() => props.id, fetchRecipe);

// (Existing scaling, servings, and other computed properties…)
// [Your existing computed properties here remain unchanged]

// NEW: Computed property for bookmark state.
const isBookmarked = computed(() => !!savedRecipe.value);

// NEW: Toggle bookmark: save if not bookmarked, unsave if already bookmarked.
async function toggleBookmark() {
  if (!currentUser.value) {
    toast.add({
      id: "bookmark-error",
      title: t("recipe.bookmark.errorTitle"),
      description: t("recipe.bookmark.errorNotLoggedIn"),
      icon: "material-symbols:error",
      timeout: 3000,
    });
    return;
  }
  if (isBookmarked.value) {
    // Unsave recipe.
    const result = await recipeStore.unsaveRecipe(props.id);
    if (result) {
      savedRecipe.value = null;
      toast.add({
        id: "bookmark-removed",
        title: t("recipe.bookmark.removedTitle"),
        description: t("recipe.bookmark.removedDescription"),
        icon: "material-symbols:bookmark-outline",
        timeout: 3000,
      });
    }
  } else {
    // Save recipe.
    const result = await recipeStore.saveRecipe(props.id);
    if (result) {
      savedRecipe.value = result;
      toast.add({
        id: "bookmark-added",
        title: t("recipe.bookmark.addedTitle"),
        description: t("recipe.bookmark.addedDescription"),
        icon: "material-symbols:bookmark",
        timeout: 3000,
      });
    }
  }
}

// Cleanup subscriptions and listeners.
const handleVisibilityChange = async () => {
  if (document.visibilityState === "visible") {
    await fetchRecipe();
    await subscribeToChanges();
  }
};

document.addEventListener("visibilitychange", handleVisibilityChange);

onBeforeUnmount(() => {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  if (subscription) {
    subscription.unsubscribe();
  }
});
</script>

<template>
  <div class="space-y-4">
    <!-- Global Error Alert -->
    <UAlert
      v-if="error"
      icon="material-symbols:error"
      color="red"
      :actions="[
        {
          variant: 'solid',
          color: 'gray',
          label: t('recipe.error.action'),
          click: fetchRecipe,
        },
      ]"
      :title="t('recipe.error.title')"
      :description="t('recipe.error.description')"
    />

    <!-- NEW: Alert when recipe.status is FAILED -->
    <template v-else-if="recipe && recipe.status === 'FAILED'">
      <UAlert
        icon="i-heroicons-command-line"
        color="red"
        variant="solid"
        :title="t('recipe.error.failedTitle')"
        :description="t('recipe.error.failedDescription')"
      />
    </template>

    <template v-if="waitingForProcessing">
      <LoadingMessages />
      <UProgress />
    </template>

    <!-- Page Header (only rendered when recipe data exists) -->
    <UPageHeader
      v-if="recipe && recipe.status !== 'FAILED'"
      :title="recipe.title"
      :links="[
        {
          icon: isBookmarked
            ? 'material-symbols:bookmark'
            : 'material-symbols:bookmark-outline',
          variant: 'ghost',
          color: 'primary',
          click: toggleBookmark,
        },
        {
          icon: 'material-symbols:share',
          variant: 'ghost',
          click: shareRecipe,
          color: 'primary',
        },
        {
          icon: 'heroicons-solid:arrows-pointing-out',
          color: 'primary',
          variant: 'ghost',
          click: () => {
            cookingMode = true;
          },
        },
        {
          icon: 'heroicons-solid:adjustments-horizontal',
          color: 'primary',
          variant: 'ghost',
          click: () => {
            isSlideoverOpen = true;
          },
        },
        ...(recipe.instacart && recipe.instacart.status === 'SUCCESS'
          ? [
              {
                icon: 'cib:instacart',
                color: 'orange',
                variant: 'ghost',
                to: recipe.instacart.url,
              },
            ]
          : []),
      ]"
    />

    <!-- Grid Layout -->
    <div
      class="grid grid-cols-1 lg:grid-cols-2 gap-4"
      v-if="waitingForProcessing || recipe?.status === 'SUCCESS'"
    >
      <!-- Column 1: Details, Nutritional Information, Ingredients -->
      <div class="space-y-4">
        <!-- Recipe Details Card -->
        <UDashboardCard :title="t('recipe.details.title')">
          <template v-if="recipe && recipe.status === 'SUCCESS'">
            <ul class="list-disc list-inside space-y-2">
              <li>{{ t("recipe.details.prepTime") }} {{ recipe.prep_time }}</li>
              <li>{{ t("recipe.details.cookTime") }} {{ recipe.cook_time }}</li>
              <!-- Updated servings line using the computed value -->
              <li>
                {{ t("recipe.details.servings") }}
                {{ scaledServingsText }}
              </li>
            </ul>
          </template>
          <template v-else>
            <!-- Skeleton: 3 full-length lines -->
            <div class="space-y-2">
              <USkeleton class="h-4 w-full" v-for="i in 3" :key="i" />
            </div>
          </template>
        </UDashboardCard>

        <!-- Nutritional Information Card -->
        <UDashboardCard
          :title="t('recipe.nutritionalInformation.title')"
          :description="t('recipe.nutritionalInformation.per_serving')"
        >
          <template
            v-if="
              recipe &&
              recipe.nutritionalInformation &&
              recipe.nutritionalInformation.status === 'SUCCESS'
            "
          >
            <ul class="list-disc list-inside space-y-2">
              <li>
                {{ t("recipe.nutritionalInformation.calories") }}:
                {{ recipe.nutritionalInformation.calories }}
              </li>
              <li>
                {{ t("recipe.nutritionalInformation.protein") }}:
                {{ recipe.nutritionalInformation.protein }}
              </li>
              <li>
                {{ t("recipe.nutritionalInformation.fat") }}:
                {{ recipe.nutritionalInformation.fat }}
              </li>
              <li>
                {{ t("recipe.nutritionalInformation.carbs") }}:
                {{ recipe.nutritionalInformation.carbs }}
              </li>
            </ul>
          </template>
          <template v-else>
            <!-- Skeleton: 4 full-length lines -->
            <div class="space-y-2">
              <USkeleton class="h-4 w-full" v-for="i in 4" :key="i" />
            </div>
          </template>
        </UDashboardCard>

        <!-- Ingredients Card -->
        <UDashboardCard :title="t('recipe.sections.ingredients')">
          <template v-if="recipe && recipe.status === 'SUCCESS'">
            <ul class="list-disc list-inside space-y-2">
              <li
                v-for="ingredient in scaledIngredients"
                :key="ingredient.name"
              >
                {{ ingredient.quantity }} {{ ingredient.unit }}
                {{ ingredient.name }}
              </li>
            </ul>
          </template>
          <template v-else>
            <!-- Skeleton: 10 full-length lines -->
            <div class="space-y-2">
              <USkeleton class="h-4 w-full" v-for="i in 10" :key="i" />
            </div>
          </template>
        </UDashboardCard>
      </div>

      <!-- Column 2: Steps -->
      <div>
        <UDashboardCard :title="t('recipe.sections.steps')">
          <template v-if="recipe && recipe.status === 'SUCCESS'">
            <ol class="list-decimal list-inside space-y-4">
              <li v-for="instruction in recipe.instructions" :key="instruction">
                {{ instruction }}
              </li>
            </ol>
          </template>
          <template v-else>
            <!-- Skeleton: 5 paragraph-looking blocks -->
            <div class="space-y-4">
              <USkeleton class="h-20 w-full" v-for="i in 5" :key="i" />
            </div>
          </template>
        </UDashboardCard>
      </div>
    </div>

    <!-- Link to Original Recipe -->
    <div
      class="flex w-full justify-center"
      v-if="recipe && recipe.url && recipe.status !== 'FAILED'"
    >
      <ULink :to="recipe.url">
        <UButton variant="ghost" block>
          {{ t("recipe.buttons.originalRecipe") }}
        </UButton>
      </ULink>
    </div>
  </div>

  <!-- Cooking Mode and Configuration Slideover -->
  <RecipeCookingMode
    v-model:is-open="cookingMode"
    :recipe="recipe"
    :scaled-ingredients="scaledIngredients"
  />

  <USlideover v-model="isSlideoverOpen">
    <div class="p-4 flex-1 relative">
      <UButton
        color="gray"
        variant="ghost"
        size="sm"
        icon="i-heroicons-x-mark-20-solid"
        class="flex sm:hidden absolute end-5 top-5 z-10"
        square
        padded
        @click="isSlideoverOpen = false"
      />
      <div class="space-y-4">
        <h2 class="text-xl font-bold mb-4">
          {{ t("recipe.configuration.title") }}
        </h2>

        <UDivider :label="t('recipe.configuration.divider.scaling')" />

        <div v-if="canScaleByServings">
          <label class="block mb-2 font-bold">
            {{ t("recipe.configuration.method.label") }}
          </label>
          <USelect
            v-model="scalingMethod"
            :options="[
              {
                label: t('recipe.configuration.method.ingredients'),
                value: 'ingredients',
              },
              {
                label: t('recipe.configuration.method.servings'),
                value: 'servings',
              },
            ]"
          />
        </div>

        <div v-if="scalingMethod === 'ingredients'">
          <label class="block mb-2 font-bold">
            {{ t("recipe.configuration.scale.scale") }}
            {{ ingredientScaleLabel }}
          </label>
          <URange v-model:modelValue="scale" :step="0.5" :min="0.5" :max="10" />
        </div>
        <div v-else>
          <label class="block mb-2 font-bold">
            {{ t("recipe.configuration.servings.new") }}
          </label>
          <UInput v-model.number="desiredServings" type="number" min="1" />
          <!-- Display the original serving size as a subtitle -->
          <div class="text-sm text-gray-500 mt-1">
            {{ servingsScaleLabel }}
          </div>
        </div>
      </div>
    </div>
  </USlideover>
</template>

<style module scoped>
/* Tailwind CSS handles all styling */
</style>

<i18n lang="json">
{
  "en": {
    "recipe": {
      "nutritionalInformation": {
        "per_serving": "Per Serving",
        "title": "Nutritional Information",
        "calories": "Calories",
        "protein": "Protein",
        "fat": "Fat",
        "carbs": "Carbohydrates"
      },
      "share": {
        "defaultText": "Check out this recipe!",
        "successTitle": "Shared",
        "successDescription": "Recipe shared successfully.",
        "errorTitle": "Share Error",
        "errorDescription": "Unable to share the recipe.",
        "copiedTitle": "Copied",
        "copiedDescription": "Recipe URL copied to clipboard.",
        "clipboardErrorTitle": "Clipboard Error",
        "clipboardErrorDescription": "Failed to copy the URL."
      },
      "configuration": {
        "title": "Configure Recipe",
        "divider": {
          "scaling": "Scaling"
        },
        "scale": {
          "scale": "Scale:",
          "half": "Half Recipe",
          "full": "Full Recipe",
          "double": "Double Recipe",
          "custom": "{value}× Recipe"
        },
        "servings": {
          "new": "New Servings:",
          "original": "Original serving size: { original }"
        },
        "method": {
          "label": "Scaling Method:",
          "ingredients": "By Ingredients",
          "servings": "By Servings"
        }
      },
      "error": {
        "title": "Error",
        "description": "There was a problem getting the recipe.",
        "action": "Try Again",
        "failedTitle": "Error!",
        "failedDescription": "There was an error processing your recipe. Please go back and try again.",
        "failedAction": "Go Back"
      },
      "details": {
        "title": "Recipe Details",
        "prepTime": "Prep time:",
        "cookTime": "Cook time:",
        "servings": "Servings:"
      },
      "sections": {
        "ingredients": "Ingredients",
        "steps": "Steps"
      },
      "buttons": {
        "originalRecipe": "Go to original recipe"
      },
      "bookmark": {
        "errorTitle": "Bookmark Error",
        "errorNotLoggedIn": "You must be logged in to bookmark recipes.",
        "addedTitle": "Recipe Bookmarked",
        "addedDescription": "Recipe has been added to your bookmarks.",
        "removedTitle": "Bookmark Removed",
        "removedDescription": "Recipe has been removed from your bookmarks."
      }
    }
  },
  "fr": {
    "recipe": {
      "nutritionalInformation": {
        "per_serving": "Par portion",
        "title": "Informations nutritionnelles",
        "calories": "Calories",
        "protein": "Protéines",
        "fat": "Lipides",
        "carbs": "Glucides"
      },
      "share": {
        "defaultText": "Découvrez cette recette !",
        "successTitle": "Partagé",
        "successDescription": "Recette partagée avec succès.",
        "errorTitle": "Erreur de partage",
        "errorDescription": "Impossible de partager la recette.",
        "copiedTitle": "Copié",
        "copiedDescription": "URL de la recette copiée dans le presse-papiers.",
        "clipboardErrorTitle": "Erreur du Presse-papiers",
        "clipboardErrorDescription": "Échec de la copie de l'URL."
      },
      "configuration": {
        "title": "Configurer la recette",
        "divider": {
          "scaling": "Mise à l'échelle"
        },
        "scale": {
          "scale": "Échelle :",
          "half": "Demi-recette",
          "full": "Recette complète",
          "double": "Double recette",
          "custom": "Recette {value}×"
        },
        "servings": {
          "new": "Nouvelles portions :",
          "original": "Portion originale : { original }"
        },
        "method": {
          "label": "Méthode de mise à l'échelle :",
          "ingredients": "Par ingrédients",
          "servings": "Par portions"
        }
      },
      "error": {
        "title": "Erreur",
        "description": "Un problème est survenu lors de la récupération de la recette.",
        "action": "Réessayer",
        "failedTitle": "Erreur !",
        "failedDescription": "Une erreur est survenue lors du traitement de votre recette. Veuillez revenir en arrière et réessayer.",
        "failedAction": "Retour"
      },
      "details": {
        "title": "Détails de la recette",
        "prepTime": "Préparation :",
        "cookTime": "Cuisson :",
        "servings": "Portions :"
      },
      "sections": {
        "ingredients": "Ingrédients",
        "steps": "Étapes"
      },
      "buttons": {
        "originalRecipe": "Voir la recette originale"
      },
      "bookmark": {
        "errorTitle": "Erreur de signet",
        "errorNotLoggedIn": "Vous devez être connecté pour ajouter des recettes aux signets.",
        "addedTitle": "Recette ajoutée aux signets",
        "addedDescription": "La recette a été ajoutée à vos signets.",
        "removedTitle": "Signet supprimé",
        "removedDescription": "La recette a été retirée de vos signets."
      }
    }
  },
  "es": {
    "recipe": {
      "nutritionalInformation": {
        "per_serving": "Por ración",
        "title": "Información nutricional",
        "calories": "Calorías",
        "protein": "Proteínas",
        "fat": "Grasas",
        "carbs": "Carbohidratos"
      },
      "share": {
        "defaultText": "¡Mira esta receta!",
        "successTitle": "Compartido",
        "successDescription": "Receta compartida exitosamente.",
        "errorTitle": "Error al compartir",
        "errorDescription": "No se pudo compartir la receta.",
        "copiedTitle": "Copiado",
        "copiedDescription": "URL de la receta copiada al portapapeles.",
        "clipboardErrorTitle": "Error del portapapeles",
        "clipboardErrorDescription": "No se pudo copiar la URL."
      },
      "configuration": {
        "title": "Configurar Receta",
        "divider": {
          "scaling": "Escalado"
        },
        "scale": {
          "scale": "Escala:",
          "half": "Media receta",
          "full": "Receta completa",
          "double": "Doble receta",
          "custom": "Receta {value}×"
        },
        "servings": {
          "new": "Nuevas porciones:",
          "original": "Tamaño original: { original }"
        },
        "method": {
          "label": "Método de escalado:",
          "ingredients": "Por ingredientes",
          "servings": "Por porciones"
        }
      },
      "error": {
        "title": "Error",
        "description": "Hubo un problema al obtener la receta.",
        "action": "Intentar de nuevo",
        "failedTitle": "¡Error!",
        "failedDescription": "Ocurrió un error al procesar tu receta. Por favor, regresa e inténtalo de nuevo.",
        "failedAction": "Regresar"
      },
      "details": {
        "title": "Detalles de la Receta",
        "prepTime": "Tiempo de preparación:",
        "cookTime": "Tiempo de cocción:",
        "servings": "Porciones:"
      },
      "sections": {
        "ingredients": "Ingredientes",
        "steps": "Pasos"
      },
      "buttons": {
        "originalRecipe": "Ir a la receta original"
      },
      "bookmark": {
        "errorTitle": "Error de marcador",
        "errorNotLoggedIn": "Debes iniciar sesión para marcar recetas.",
        "addedTitle": "Receta marcada",
        "addedDescription": "La receta ha sido agregada a tus marcadores.",
        "removedTitle": "Marcador eliminado",
        "removedDescription": "La receta ha sido removida de tus marcadores."
      }
    }
  }
}
</i18n>
