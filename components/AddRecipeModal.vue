<script setup lang="ts">
import { reactive, ref } from "vue";
import * as yup from "yup";
import { uploadData } from "aws-amplify/storage";
import { useI18n } from "vue-i18n";
import { useRecipe } from "~/composables/useRecipe";

const { t, locale } = useI18n({ useScope: "local" });
const toast = useToast();
const router = useRouter();
const localePath = useLocalePath();
const overlay = useOverlay();

defineEmits(["close"]);

// Form state
const state = reactive({
  recipeUrl: "",
});
const submitting = ref(false);

// File input references
const fileInput = ref<HTMLInputElement | null>(null);
const cameraInput = ref<HTMLInputElement | null>(null);

// Schema for validation
const schema = yup.object().shape({
  recipeUrl: yup
    .string()
    .url(t("addRecipeModal.invalidUrl"))
    .required(t("addRecipeModal.urlRequired")),
});

const validate = async (state: any): Promise<FormError<string>[]> => {
  try {
    await schema.validate(state, { abortEarly: false });
    return [];
  } catch (error) {
    const validationErrors = error as yup.ValidationError;
    return validationErrors.inner.map((err) => ({
      path: err.path || "",
      message: err.message,
    }));
  }
};

// Submit handler
async function onSubmit(event: FormSubmitEvent<any>) {
  try {
    submitting.value = true;

    const recipeStore = useRecipe();

    const { id } =
      (await recipeStore.createRecipe({
        url: state.recipeUrl,
        language: locale.value,
      })) || {};

    console.log("Recipe created with ID:", id);

    if (id) {
      router.push(localePath(`/recipes/${id}`));
      // Close the modal by closing the overlay instance
      overlay.close();
    }
  } catch (error) {
    toast.add({
      id: "recipe_error",
      title: t("addRecipeModal.submitErrorTitle"),
      description: t("addRecipeModal.submitErrorDescription"),
      icon: "i-heroicons-exclamation-circle",
      color: "red",
      duration: 5000,
    });
  } finally {
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
    console.log("Selected file:", file);

    // Check that the file is an image
    if (!file.type.startsWith("image/")) {
      toast.add({
        id: "invalid_file_type",
        title: t("addRecipeModal.invalidFileTypeTitle"),
        description: t("addRecipeModal.invalidFileTypeDescription"),
        icon: "i-heroicons-exclamation-circle",
        color: "red",
        duration: 5000,
      });
      return;
    }

    // Generate a UUID and preserve the file extension
    const uuid = crypto.randomUUID();
    let extension = file.name.split(".").pop() || "";
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
          console.log("File uploaded successfully!");

          toast.add({
            id: "upload_success",
            title: t("addRecipeModal.uploadSuccessTitle"),
            description: t("addRecipeModal.uploadSuccessDescription"),
            icon: "i-heroicons-check-circle",
            color: "green",
            duration: 5000,
          });

          // Create a new recipe with an empty URL and the image's UUID
          const recipeStore = useRecipe();
          const { id } = await recipeStore.createRecipe({
            url: "",
            pictureSubmissionUUID: `${uuid}.${extension}`,
          });
          if (id) {
            router.push(localePath(`/recipes/${id}`));
            // Close the modal
            overlay.close();
          }
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError);
          toast.add({
            id: "upload_error",
            title: t("addRecipeModal.uploadErrorTitle"),
            description: t("addRecipeModal.uploadErrorDescription"),
            icon: "i-heroicons-exclamation-circle",
            color: "red",
            duration: 5000,
          });
        } finally {
          submitting.value = false;
        }
      }
    };
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:px-5 sm:py-20">
    <div class="fixed inset-0 bg-black/75 transition-opacity"></div>
    <div
      class="relative mx-auto max-w-2xl rounded-lg bg-white p-4 shadow-lg transition-all dark:bg-gray-800"
    >
      <!-- Header -->
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-semibold">{{ t("addRecipeModal.title") }}</h3>
        <button
          class="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          @click="overlay.close()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      <!-- Description -->
      <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {{ t("addRecipeModal.description") }}
      </p>

      <!-- Form -->
      <form class="space-y-4" @submit.prevent="onSubmit">
        <!-- URL input -->
        <div class="space-y-2">
          <div class="flex items-center">
            <input
              id="recipeUrl"
              v-model="state.recipeUrl"
              class="grow block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              type="text"
              :placeholder="t('addRecipeModal.inputPlaceholder')"
            />
            <button
              type="button"
              class="ml-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-2 text-sm leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              @click="browseForImage"
            >
              <span class="sr-only">Browse for Image</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>
            <button
              type="button"
              class="ml-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-2 text-sm leading-4 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              @click="takePhoto"
            >
              <span class="sr-only">Take Photo</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
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
        </div>

        <!-- Submit button -->
        <button
          type="submit"
          class="w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-70"
          :disabled="submitting"
        >
          {{
            submitting
              ? t("addRecipeModal.submitting")
              : t("addRecipeModal.submitButton")
          }}
        </button>

        <!-- Info text -->
        <p class="text-xs text-gray-500 mt-2 text-center">
          {{ t("addRecipeModal.freeInfo") }}
        </p>
      </form>
    </div>
  </div>
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
      "freeInfo": "All features are completely free—no signup required! Create an account only if you want to save your data across sessions."
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
      "freeInfo": "Toutes les fonctionnalités sont complètement gratuites – aucune inscription n'est requise ! Créez un compte uniquement si vous souhaitez conserver vos données entre les sessions."
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
      "freeInfo": "¡Todas las funciones son completamente gratuitas, sin necesidad de registrarte! Crea una cuenta solo si deseas guardar tus datos entre sesiones."
    }
  }
}
</i18n>
