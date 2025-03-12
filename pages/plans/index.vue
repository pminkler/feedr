<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { useLocalePath, useModal } from "#imports";
import { useMealPlan } from "~/composables/useMealPlan";

const { t } = useI18n({ useScope: "local" });
const localePath = useLocalePath();
const modal = useModal();
const { mealPlansState, isLoading, getMealPlans, createMealPlan } = useMealPlan();

// Table columns configuration
const columns = [
  {
    key: "id",
    label: t("mealPlans.id"),
  },
  {
    key: "recipeCount",
    label: t("mealPlans.recipeCount"),
  },
  {
    key: "createdAt",
    label: t("mealPlans.createdAt"),
  },
  {
    key: "actions",
    label: t("mealPlans.actions"),
  },
];

const handleCreateMealPlan = async () => {
  console.log('Create meal plan clicked');
  try {
    const newPlan = await createMealPlan();
    console.log('New meal plan created:', newPlan);
    
    // Navigate to the new meal plan detail page
    navigateTo(`/plans/${newPlan.id}`);
  } catch (error) {
    console.error('Error creating meal plan:', error);
  }
};

onMounted(async () => {
  try {
    await getMealPlans();
  } catch (error) {
    console.error("Error loading meal plans:", error);
  }
});

// Clean up any resources when navigating away
onBeforeUnmount(() => {
  // Clean up resources if needed
});

definePageMeta({
  middleware: "auth",
  layout: "dashboard",
});
</script>

<template>
  <UDashboardPage>
    <UDashboardPanel grow>
      <UDashboardNavbar :title="t('mealPlans.title')"></UDashboardNavbar>
      
      <UDashboardPanelContent>
        <template v-if="isLoading">
          <div class="w-full mt-4">
            <USkeleton class="h-80 w-full" />
          </div>
        </template>
        
        <!-- Loaded state with no meal plans -->
        <template v-else-if="mealPlansState.length === 0">
          <div class="w-full flex flex-col items-center justify-center gap-4 p-8">
            <UAlert
              class="w-full md:w-1/2"
              icon="material-symbols:info"
              color="yellow"
              variant="solid"
              :title="t('mealPlans.noPlansTitle')"
              :description="t('mealPlans.noPlansDescription')"
            />
            
            <UButton
              color="primary"
              icon="i-heroicons-plus"
              size="lg"
              @click="handleCreateMealPlan"
            >
              {{ t('mealPlans.createPlan') }}
            </UButton>
          </div>
        </template>
        
        <!-- Loaded state with meal plans -->
        <template v-else>
          <div class="flex justify-end mb-4">
            <UButton
              color="primary"
              icon="i-heroicons-plus"
              @click="handleCreateMealPlan"
            >
              {{ t('mealPlans.createPlan') }}
            </UButton>
          </div>
          
          <UTable
            :columns="columns"
            :rows="mealPlansState"
            :ui="{ 
              wrapper: 'border rounded-lg' 
            }"
          >
            <template #recipeCount-cell="{ row }">
              {{ row.recipes.length }} {{ t('mealPlans.recipes') }}
            </template>
            
            <template #createdAt-cell="{ row }">
              {{ new Date(row.createdAt).toLocaleDateString() }}
            </template>
            
            <template #actions-cell="{ row }">
              <UButton
                color="primary"
                variant="ghost"
                icon="i-heroicons-eye"
                :to="localePath(`/plans/${row.id}`)"
              >
                {{ t('mealPlans.view') }}
              </UButton>
            </template>
          </UTable>
        </template>
      </UDashboardPanelContent>
    </UDashboardPanel>
  </UDashboardPage>
</template>

<i18n lang="json">
{
  "en": {
    "mealPlans": {
      "title": "Meal Plans",
      "id": "ID",
      "recipeCount": "Recipes",
      "createdAt": "Created",
      "actions": "Actions",
      "recipes": "recipes",
      "noPlansTitle": "No Meal Plans",
      "noPlansDescription": "You haven't created any meal plans yet. Click the button below to create your first meal plan.",
      "createPlan": "Create Meal Plan",
      "view": "View"
    }
  },
  "fr": {
    "mealPlans": {
      "title": "Plans de Repas",
      "id": "ID",
      "recipeCount": "Recettes",
      "createdAt": "Créé le",
      "actions": "Actions",
      "recipes": "recettes",
      "noPlansTitle": "Aucun Plan de Repas",
      "noPlansDescription": "Vous n'avez pas encore créé de plan de repas. Cliquez sur le bouton ci-dessous pour créer votre premier plan de repas.",
      "createPlan": "Créer un Plan de Repas",
      "view": "Voir"
    }
  },
  "es": {
    "mealPlans": {
      "title": "Planes de Comidas",
      "id": "ID",
      "recipeCount": "Recetas",
      "createdAt": "Creado",
      "actions": "Acciones",
      "recipes": "recetas",
      "noPlansTitle": "Sin Planes de Comidas",
      "noPlansDescription": "No has creado ningún plan de comidas todavía. Haz clic en el botón de abajo para crear tu primer plan de comidas.",
      "createPlan": "Crear Plan de Comidas",
      "view": "Ver"
    }
  }
}
</i18n>