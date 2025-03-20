<script setup lang="ts">
import { ref, defineEmits } from "vue";
import { useI18n } from "vue-i18n";
import { deleteUser } from "aws-amplify/auth";
import { useRouter } from "vue-router";
import { useAuth } from "~/composables/useAuth";
import { useRecipe } from "~/composables/useRecipe";
import { useMealPlan } from "~/composables/useMealPlan";

const { t } = useI18n({ useScope: "local" });
const router = useRouter();
const localePath = useLocalePath();
const toast = useToast();
const { deleteAllRecipes } = useRecipe();
const { deleteAllMealPlans } = useMealPlan();

// Control whether the modal is open
const isOpen = ref(true);

// Track deletion state
const isDeleting = ref(false);
const isSuccess = ref(false);

// Define emits
const emit = defineEmits(["close", "success"]);

// Handle account deletion
const handleDeleteAccount = async () => {
  if (isDeleting.value) return;

  isDeleting.value = true;

  try {
    // Step 1: Delete all user data
    await deleteAllRecipes();
    await deleteAllMealPlans();

    // Step 2: Delete the user account from Cognito
    await deleteUser();

    // Step 3: Show success state
    isSuccess.value = true;
  } catch (error) {
    console.error("Error deleting account:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    toast.add({
      title: t("deleteAccount.error"),
      description: errorMessage,
      color: "red",
    });

    // Close the modal on error
    isOpen.value = false;
    emit("close");
  } finally {
    isDeleting.value = false;
  }
};

// Handle going back to home after account deletion
const goToHome = () => {
  isOpen.value = false;
  emit("success");
  router.push(localePath("/"));
};

// Close the modal
const closeModal = () => {
  if (!isDeleting.value) {
    isOpen.value = false;
    emit("close");
  }
};
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :prevent-close="isDeleting"
    :title="!isSuccess ? t('deleteAccount.confirmTitle') : t('deleteAccount.accountDeleted')"
    :description="!isSuccess ? t('deleteAccount.confirmDescription') : ''"
  >
    <template #default>
      <!-- Empty default slot as shown in AddTagsModal -->
    </template>

    <template #body>
      <div v-if="!isSuccess">
        <p class="mb-4 font-bold text-(--ui-text-danger)">
          {{ t("deleteAccount.warning") }}
        </p>
        <ul class="list-disc ml-6 mb-4 text-sm">
          <li>{{ t("deleteAccount.deleteDataDesc1") }}</li>
          <li>{{ t("deleteAccount.deleteDataDesc3") }}</li>
        </ul>

        <p class="text-sm font-medium mt-4">
          {{ t("deleteAccount.finalConfirmation") }}
        </p>
      </div>
      <div v-else>
        <p>{{ t("deleteAccount.successMessage") }}</p>
      </div>
    </template>

    <template #footer>
      <template v-if="!isSuccess">
        <div class="flex justify-end space-x-2 w-full">
          <UButton
            variant="ghost"
            color="gray"
            :disabled="isDeleting"
            @click="closeModal"
          >
            {{ t("common.cancel") }}
          </UButton>

          <UButton
            color="error"
            :loading="isDeleting"
            :disabled="isDeleting"
            @click="handleDeleteAccount"
          >
            <template #leading>
              <UIcon name="i-heroicons-trash" />
            </template>
            {{ t("deleteAccount.confirmDelete") }}
          </UButton>
        </div>
      </template>
      <template v-else>
        <div class="flex justify-end space-x-2 w-full">
          <UButton color="primary" @click="goToHome">
            {{ t("common.returnToHome") }}
          </UButton>
        </div>
      </template>
    </template>
  </UModal>
</template>

<i18n lang="json">
{
  "en": {
    "deleteAccount": {
      "confirmTitle": "Delete Your Account",
      "confirmDescription": "We're sorry to see you go. Please confirm that you want to permanently delete your account.",
      "warning": "This action cannot be undone.",
      "deleteDataDesc1": "All your recipes will be permanently deleted",
      "deleteDataDesc2": "All your meal plans will be permanently deleted",
      "deleteDataDesc3": "Your account information will be removed from our systems",
      "finalConfirmation": "Are you sure you want to continue?",
      "confirmDelete": "Yes, Delete My Account",
      "accountDeleted": "Account Deleted",
      "successMessage": "Your account has been successfully deleted. Thank you for using Feedr.",
      "error": "Error deleting account"
    },
    "common": {
      "cancel": "Cancel",
      "returnToHome": "Return to Home"
    }
  },
  "fr": {
    "deleteAccount": {
      "confirmTitle": "Supprimer Votre Compte",
      "confirmDescription": "Nous sommes désolés de vous voir partir. Veuillez confirmer que vous souhaitez supprimer définitivement votre compte.",
      "warning": "Cette action ne peut pas être annulée.",
      "deleteDataDesc1": "Toutes vos recettes seront définitivement supprimées",
      "deleteDataDesc2": "Tous vos plans de repas seront définitivement supprimés",
      "deleteDataDesc3": "Les informations de votre compte seront supprimées de nos systèmes",
      "finalConfirmation": "Êtes-vous sûr de vouloir continuer ?",
      "confirmDelete": "Oui, Supprimer Mon Compte",
      "accountDeleted": "Compte Supprimé",
      "successMessage": "Votre compte a été supprimé avec succès. Merci d'avoir utilisé Feedr.",
      "error": "Erreur lors de la suppression du compte"
    },
    "common": {
      "cancel": "Annuler",
      "returnToHome": "Retourner à l'Accueil"
    }
  },
  "es": {
    "deleteAccount": {
      "confirmTitle": "Eliminar Su Cuenta",
      "confirmDescription": "Lamentamos verle partir. Por favor, confirme que desea eliminar permanentemente su cuenta.",
      "warning": "Esta acción no se puede deshacer.",
      "deleteDataDesc1": "Todas sus recetas se eliminarán permanentemente",
      "deleteDataDesc2": "Todos sus planes de comidas se eliminarán permanentemente",
      "deleteDataDesc3": "La información de su cuenta se eliminará de nuestros sistemas",
      "finalConfirmation": "¿Está seguro de que quiere continuar?",
      "confirmDelete": "Sí, Eliminar Mi Cuenta",
      "accountDeleted": "Cuenta Eliminada",
      "successMessage": "Su cuenta ha sido eliminada exitosamente. Gracias por usar Feedr.",
      "error": "Error al eliminar la cuenta"
    },
    "common": {
      "cancel": "Cancelar",
      "returnToHome": "Volver al Inicio"
    }
  }
}
</i18n>
