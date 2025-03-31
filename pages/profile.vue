<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuth } from '~/composables/useAuth';
import { fetchUserAttributes } from 'aws-amplify/auth';
import DeleteAccountModal from '~/components/DeleteAccountModal.vue';

const { t } = useI18n({ useScope: 'local' });
const { currentUser } = useAuth();
const overlay = useOverlay();
const userEmail = ref('');

// Fetch user attributes on mount
onMounted(async () => {
  try {
    const attributes = await fetchUserAttributes();
    userEmail.value = attributes.email || '';
  } catch (error) {
    console.error('Error fetching user attributes:', error);
  }
});

// Open delete confirmation modal
const openDeleteModal = () => {
  const modal = overlay.create(DeleteAccountModal);
  modal.open();
};
</script>

<template>
  <UDashboardPanel id="profile">
    <template #header>
      <UDashboardNavbar icon="i-heroicons-user-circle">
        <template #leading>
          <UDashboardSidebarCollapse />
          <div class="ml-4">
            <h1 class="text-xl font-medium">{{ t('profile.title') }}</h1>
            <p v-if="userEmail" class="text-sm text-(--ui-text-muted)">
              {{ userEmail }}
            </p>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer>
        <!-- Danger Zone Card -->
        <UCard>
          <template #header>
            <div class="flex items-center space-x-4">
              <UIcon
                name="i-heroicons-exclamation-triangle"
                class="size-10 text-(--ui-text-danger)"
              />
              <div>
                <h2 class="text-lg font-medium text-(--ui-text-danger)">
                  {{ t('profile.dangerZone') }}
                </h2>
              </div>
            </div>
          </template>

          <div class="p-4">
            <p class="text-sm mb-4 text-gray-600 dark:text-gray-400">
              {{ t('profile.accountDeletionInfo') }}
            </p>

            <div class="flex justify-end">
              <UButton color="error" variant="solid" @click="openDeleteModal">
                <template #leading>
                  <UIcon name="i-heroicons-trash" />
                </template>
                {{ t('profile.deleteAccount') }}
              </UButton>
            </div>
          </div>
        </UCard>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>

<i18n lang="json">
{
  "en": {
    "profile": {
      "title": "Account Profile",
      "description": "Manage your account settings and preferences.",
      "accountInfo": "Account Information",
      "accountInfoDescription": "Here's your basic account information.",
      "username": "Username",
      "email": "Email",
      "dangerZone": "Danger Zone",
      "deleteAccount": "Delete Account",
      "deleteAccountConfirmTitle": "Delete Your Account",
      "deleteAccountConfirmDescription": "We're sorry to see you go. Please confirm that you want to permanently delete your account.",
      "deleteAccountWarning": "This action cannot be undone.",
      "deleteDataDesc1": "All your recipes will be permanently deleted",
      "deleteDataDesc3": "Your account information will be removed from our systems",
      "finalConfirmation": "Are you sure you want to continue?",
      "confirmDelete": "Yes, Delete My Account",
      "accountDeleted": "Account Deleted",
      "deleteSuccessMessage": "Your account has been successfully deleted. Thank you for using Feedr.",
      "deleteAccountError": "Error deleting account",
      "accountDeletionInfo": "Deleting your account will permanently remove all your data from our systems. This action cannot be undone."
    },
    "common": {
      "cancel": "Cancel",
      "returnToHome": "Return to Home"
    }
  },
  "fr": {
    "profile": {
      "title": "Profil du Compte",
      "description": "Gérez les paramètres et préférences de votre compte.",
      "accountInfo": "Informations du Compte",
      "accountInfoDescription": "Voici les informations de base de votre compte.",
      "username": "Nom d'utilisateur",
      "email": "Email",
      "dangerZone": "Zone de Danger",
      "deleteAccount": "Supprimer le Compte",
      "deleteAccountConfirmTitle": "Supprimer Votre Compte",
      "deleteAccountConfirmDescription": "Nous sommes désolés de vous voir partir. Veuillez confirmer que vous souhaitez supprimer définitivement votre compte.",
      "deleteAccountWarning": "Cette action ne peut pas être annulée.",
      "deleteDataDesc1": "Toutes vos recettes seront définitivement supprimées",
      "deleteDataDesc3": "Les informations de votre compte seront supprimées de nos systèmes",
      "finalConfirmation": "Êtes-vous sûr de vouloir continuer ?",
      "confirmDelete": "Oui, Supprimer Mon Compte",
      "accountDeleted": "Compte Supprimé",
      "deleteSuccessMessage": "Votre compte a été supprimé avec succès. Merci d'avoir utilisé Feedr.",
      "deleteAccountError": "Erreur lors de la suppression du compte",
      "accountDeletionInfo": "La suppression de votre compte supprimera définitivement toutes vos données de nos systèmes. Cette action ne peut pas être annulée."
    },
    "common": {
      "cancel": "Annuler",
      "returnToHome": "Retourner à l'Accueil"
    }
  },
  "es": {
    "profile": {
      "title": "Perfil de Cuenta",
      "description": "Administre la configuración y preferencias de su cuenta.",
      "accountInfo": "Información de la Cuenta",
      "accountInfoDescription": "Aquí está la información básica de su cuenta.",
      "username": "Nombre de usuario",
      "email": "Correo electrónico",
      "dangerZone": "Zona de Peligro",
      "deleteAccount": "Eliminar Cuenta",
      "deleteAccountConfirmTitle": "Eliminar Su Cuenta",
      "deleteAccountConfirmDescription": "Lamentamos verle partir. Por favor, confirme que desea eliminar permanentemente su cuenta.",
      "deleteAccountWarning": "Esta acción no se puede deshacer.",
      "deleteDataDesc1": "Todas sus recetas se eliminarán permanentemente",
      "deleteDataDesc3": "La información de su cuenta se eliminará de nuestros sistemas",
      "finalConfirmation": "¿Está seguro de que quiere continuar?",
      "confirmDelete": "Sí, Eliminar Mi Cuenta",
      "accountDeleted": "Cuenta Eliminada",
      "deleteSuccessMessage": "Su cuenta ha sido eliminada exitosamente. Gracias por usar Feedr.",
      "deleteAccountError": "Error al eliminar la cuenta",
      "accountDeletionInfo": "Al eliminar su cuenta, se eliminarán permanentemente todos sus datos de nuestros sistemas. Esta acción no se puede deshacer."
    },
    "common": {
      "cancel": "Cancelar",
      "returnToHome": "Volver al Inicio"
    }
  }
}
</i18n>
