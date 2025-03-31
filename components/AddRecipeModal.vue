<script setup lang="ts">
import { reactive, ref } from 'vue';
import { uploadData } from 'aws-amplify/storage';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n({ useScope: 'local' });
const toast = useToast();
const router = useRouter();
const localePath = useLocalePath();
const isOpen = ref(true);

const emit = defineEmits(['close']);

// Form state
const state = reactive({
  recipeUrl: '',
});
const submitting = ref(false);

// Close modal function
function closeModal() {
  emit('close', false);
}

// File input references
const fileInput = ref<HTMLInputElement | null>(null);
const cameraInput = ref<HTMLInputElement | null>(null);

// Submit handler
async function onSubmit() {
  try {
    submitting.value = true;

    const recipeStore = useRecipe();

    const { id }
      = (await recipeStore.createRecipe({
        url: state.recipeUrl,
        language: locale.value,
      })) || {};

    console.log('Recipe created with ID:', id);

    if (id) {
      router.push(localePath(`/recipes/${id}`));
      // Close the modal by closing the overlay instance
      emit('close', false);
    }
  }
  catch {
    toast.add({
      id: 'recipe_error',
      title: t('addRecipeModal.submitErrorTitle'),
      description: t('addRecipeModal.submitErrorDescription'),
      icon: 'i-heroicons-exclamation-circle',
      color: 'error',
      duration: 5000,
    });
  }
  finally {
    submitting.value = false;
  }
}

// File input helpers
function browseForImage() {
  fileInput.value?.click();
}

function takePhoto() {
  cameraInput.value?.click();
}

// Handle file upload
function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    console.log('Selected file:', file);

    // Check that the file is an image
    if (!file.type.startsWith('image/')) {
      toast.add({
        id: 'invalid_file_type',
        title: t('addRecipeModal.invalidFileTypeTitle'),
        description: t('addRecipeModal.invalidFileTypeDescription'),
        icon: 'i-heroicons-exclamation-circle',
        color: 'error',
        duration: 5000,
      });
      return;
    }

    // Generate a UUID and preserve the file extension
    const uuid = crypto.randomUUID();
    let extension = file.name.split('.').pop() || '';
    extension = extension.toLowerCase();

    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);

    fileReader.onload = async (e) => {
      const fileData = e.target?.result;
      if (fileData) {
        try {
          submitting.value = true;
          // Upload the file using the UUID and extension
          const filePath = `picture-submissions/${uuid}.${extension}`;
          await uploadData({
            data: fileData,
            path: filePath,
          });
          console.log('File uploaded successfully!');

          toast.add({
            id: 'upload_success',
            title: t('addRecipeModal.uploadSuccessTitle'),
            description: t('addRecipeModal.uploadSuccessDescription'),
            icon: 'i-heroicons-check-circle',
            color: 'success',
            duration: 5000,
          });

          // Create a new recipe with an empty URL and the image's UUID
          const recipeStore = useRecipe();
          const { id } = await recipeStore.createRecipe({
            url: '',
            pictureSubmissionUUID: `${uuid}.${extension}`,
          });
          if (id) {
            router.push(localePath(`/recipes/${id}`));
            // Close the modal
            emit('close', false);
          }
        }
        catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          toast.add({
            id: 'upload_error',
            title: t('addRecipeModal.uploadErrorTitle'),
            description: t('addRecipeModal.uploadErrorDescription'),
            icon: 'i-heroicons-exclamation-circle',
            color: 'error',
            duration: 5000,
          });
        }
        finally {
          submitting.value = false;
        }
      }
    };
  }
}
</script>

<template>
  <UModal
    v-model="isOpen"
    :title="t('addRecipeModal.title')"
    :description="t('addRecipeModal.description')"
  >
    <template #default>
      <!-- Trigger button not needed when modal is controlled programmatically -->
    </template>

    <template #body>
      <!-- Form -->
      <form class="space-y-4" @submit.prevent="onSubmit">
        <!-- URL input -->
        <div class="flex items-center">
          <UInput
            id="recipeUrl"
            v-model="state.recipeUrl"
            class="grow"
            :placeholder="t('addRecipeModal.inputPlaceholder')"
          />
          <UButton
            type="button"
            variant="outline"
            color="primary"
            icon="i-heroicons-photo"
            class="ml-2"
            aria-label="Browse for Image"
            @click="browseForImage"
          />
          <UButton
            type="button"
            variant="outline"
            color="primary"
            icon="i-heroicons-camera"
            class="ml-2"
            aria-label="Take Photo"
            @click="takePhoto"
          />
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileUpload"
          />
          <input
            ref="cameraInput"
            type="file"
            accept="image/*"
            capture="environment"
            class="hidden"
            @change="handleFileUpload"
          />
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-2 w-full">
        <UButton variant="ghost" :disabled="submitting" @click="closeModal">
          {{ t('addRecipeModal.cancel') }}
        </UButton>
        <UButton :loading="submitting" color="primary" @click="onSubmit">
          {{ t('addRecipeModal.submitButton') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<i18n lang="json">
{
  "en": {
    "addRecipeModal": {
      "title": "Create New Recipe",
      "description": "Enter a recipe URL or upload an image to generate a new recipe",
      "inputPlaceholder": "Recipe URL",
      "submitButton": "Get Recipe",
      "submitting": "Processing...",
      "invalidUrl": "Invalid URL",
      "urlRequired": "URL is required",
      "submitErrorTitle": "Error!",
      "submitErrorDescription": "Error creating recipe.",
      "invalidFileTypeTitle": "Invalid File Type",
      "invalidFileTypeDescription": "Only image files are allowed.",
      "uploadSuccessTitle": "Upload Successful",
      "uploadSuccessDescription": "Your image was successfully uploaded!",
      "uploadErrorTitle": "Upload Error",
      "uploadErrorDescription": "Failed to upload image.",
      "freeInfo": "All features are completely free—no signup required! Create an account only if you want to save your data across sessions.",
      "cancel": "Cancel"
    }
  },
  "fr": {
    "addRecipeModal": {
      "title": "Créer une nouvelle recette",
      "description": "Entrez l'URL d'une recette ou téléchargez une image pour générer une nouvelle recette",
      "inputPlaceholder": "URL de la recette",
      "submitButton": "Obtenir la recette",
      "submitting": "Traitement en cours...",
      "invalidUrl": "URL invalide",
      "urlRequired": "L'URL est requise",
      "submitErrorTitle": "Erreur !",
      "submitErrorDescription": "Erreur lors de la création de la recette.",
      "invalidFileTypeTitle": "Type de fichier invalide",
      "invalidFileTypeDescription": "Seuls les fichiers image sont autorisés.",
      "uploadSuccessTitle": "Téléchargement réussi",
      "uploadSuccessDescription": "Votre image a été téléchargée avec succès !",
      "uploadErrorTitle": "Erreur de téléchargement",
      "uploadErrorDescription": "Échec du téléchargement de l'image.",
      "freeInfo": "Toutes les fonctionnalités sont complètement gratuites – aucune inscription n'est requise ! Créez un compte uniquement si vous souhaitez conserver vos données entre les sessions.",
      "cancel": "Annuler"
    }
  },
  "es": {
    "addRecipeModal": {
      "title": "Crear nueva receta",
      "description": "Ingrese una URL de receta o suba una imagen para generar una nueva receta",
      "inputPlaceholder": "URL de la receta",
      "submitButton": "Obtener receta",
      "submitting": "Procesando...",
      "invalidUrl": "URL inválida",
      "urlRequired": "La URL es obligatoria",
      "submitErrorTitle": "¡Error!",
      "submitErrorDescription": "Error al crear la receta.",
      "invalidFileTypeTitle": "Tipo de archivo inválido",
      "invalidFileTypeDescription": "Solo se permiten archivos de imagen.",
      "uploadSuccessTitle": "Carga exitosa",
      "uploadSuccessDescription": "¡Tu imagen se ha cargado correctamente!",
      "uploadErrorTitle": "Error de carga",
      "uploadErrorDescription": "Error al cargar la imagen.",
      "freeInfo": "¡Todas las funciones son completamente gratuitas, sin necesidad de registrarte! Crea una cuenta solo si deseas guardar tus datos entre sesiones.",
      "cancel": "Cancelar"
    }
  }
}
</i18n>
