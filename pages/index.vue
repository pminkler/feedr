<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import * as yup from "yup";
import { uploadData } from "aws-amplify/storage";
import { useI18n } from "vue-i18n";

// Other composables and helpers
const { gtag } = useGtag();
const toast = useToast();
const localePath = useLocalePath();
const route = useRoute();
const { t, locale } = useI18n({ useScope: "local" });

const state = reactive({
  recipeUrl: route.query.url || "",
});

const submitting = ref(false);

const schema = yup.object().shape({
  recipeUrl: yup
    .string()
    .url(t("landing.invalidUrl"))
    .required(t("landing.urlRequired")),
});

const validate = async (state: any): Promise<FormError[]> => {
  try {
    await schema.validate(state, { abortEarly: false });
    return [];
  } catch (validationErrors) {
    return validationErrors.inner.map((error: yup.ValidationError) => ({
      path: error.path,
      message: error.message,
    }));
  }
};

onMounted(() => {
  if (state.recipeUrl) {
    onSubmit({ event: { preventDefault: () => {} } } as any);
  }
});

async function onSubmit(event: FormSubmitEvent<any>) {
  try {
    submitting.value = true;
    gtag("event", "submit_recipe", {
      event_category: "interaction",
      event_label: "Recipe Submission",
      value: state.recipeUrl,
    });

    const recipeStore = useRecipe();

    const { id } =
      (await recipeStore.createRecipe({
        url: state.recipeUrl,
        language: locale.value,
      })) || {};

    console.log("Recipe created with ID:", id);

    if (id) {
      navigateTo(localePath(`/recipes/${id}`));
    }
  } catch (error) {
    toast.add({
      id: "recipe_error",
      title: t("landing.submitErrorTitle"),
      description: t("landing.submitErrorDescription"),
      icon: "i-heroicons-exclamation-circle",
      color: "red",
      timeout: 5000,
    });
  } finally {
    submitting.value = false;
  }
}

// File input logic for browsing images
const fileInput = ref<HTMLInputElement | null>(null);
function browseForImage() {
  fileInput.value?.click();
}

// File input logic for taking a photo (camera capture)
const cameraInput = ref<HTMLInputElement | null>(null);
function takePhoto() {
  cameraInput.value?.click();
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    console.log("Selected file:", file);

    // Check that the file is an image (even though the input only accepts images)
    if (!file.type.startsWith("image/")) {
      toast.add({
        id: "invalid_file_type",
        title: t("landing.invalidFileTypeTitle"),
        description: t("landing.invalidFileTypeDescription"),
        icon: "heroicons:exclamation-circle",
        color: "red",
        timeout: 5000,
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
          // Upload the file using the UUID and extension
          const filePath = `picture-submissions/${uuid}.${extension}`;
          await uploadData({
            data: fileData,
            path: filePath,
          });
          console.log("File uploaded successfully!");

          toast.add({
            id: "upload_success",
            title: t("landing.uploadSuccessTitle"),
            description: t("landing.uploadSuccessDescription"),
            icon: "heroicons:check-circle",
            color: "green",
            timeout: 5000,
          });

          // Create a new recipe with an empty URL and the image's UUID (including extension)
          const recipeStore = useRecipe();
          const { id } = await recipeStore.createRecipe({
            url: "",
            pictureSubmissionUUID: `${uuid}.${extension}`,
          });
          if (id) {
            navigateTo(localePath(`/recipes/${id}`));
          }
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError);
          toast.add({
            id: "upload_error",
            title: t("landing.uploadErrorTitle"),
            description: t("landing.uploadErrorDescription"),
            icon: "heroicons:exclamation-circle",
            color: "red",
            timeout: 5000,
          });
        }
      }
    };
  }
}
</script>

<template>
  <div>
    <ULandingHero
      :title="$t('landing.title')"
      :description="$t('landing.subtitle')"
    >
      <template #default>
        <div class="mx-auto w-full md:w-1/2 text-center space-y-4">
          <UForm
            :validate="validate"
            :state="state"
            class="space-y-4"
            @submit="onSubmit"
          >
            <!-- Wrap the input and buttons in a flex container -->
            <UFormGroup name="recipeUrl">
              <div class="flex items-center">
                <UInput
                  v-model="state.recipeUrl"
                  :placeholder="$t('landing.inputPlaceholder')"
                  class="flex-grow"
                />
                <!-- Button with icon to trigger file input for browsing -->
                <UButton
                  type="button"
                  @click="browseForImage"
                  class="ml-2"
                  icon="heroicons:photo-16-solid"
                  variant="ghost"
                />
                <!-- Button with icon to trigger camera input for taking a photo -->
                <UButton
                  type="button"
                  @click="takePhoto"
                  class="ml-2"
                  icon="heroicons:camera"
                  variant="ghost"
                />
                <!-- Hidden file input for browsing images -->
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleFileUpload"
                />
                <!-- Hidden file input for taking a photo; capture attribute prompts the camera -->
                <input
                  ref="cameraInput"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="hidden"
                  @change="handleFileUpload"
                />
              </div>
            </UFormGroup>
            <UButton type="submit" :loading="submitting" block>
              {{ $t("landing.submitButton") }}
            </UButton>
          </UForm>
        </div>
      </template>
    </ULandingHero>
  </div>
</template>

<style module scoped></style>

<i18n lang="json">
{
  "en": {
    "landing": {
      "title": "Submit Your Recipe",
      "subtitle": "Share your recipe with the world",
      "inputPlaceholder": "Enter the recipe URL",
      "submitButton": "Submit Recipe",
      "invalidUrl": "Invalid URL",
      "urlRequired": "URL is required",
      "submitErrorTitle": "Error!",
      "submitErrorDescription": "Error creating recipe.",
      "invalidFileTypeTitle": "Invalid File Type",
      "invalidFileTypeDescription": "Only image files are allowed.",
      "uploadSuccessTitle": "Upload Successful",
      "uploadSuccessDescription": "Your image was successfully uploaded!",
      "uploadErrorTitle": "Upload Error",
      "uploadErrorDescription": "Failed to upload image."
    }
  },
  "fr": {
    "landing": {
      "title": "Soumettez votre recette",
      "subtitle": "Partagez votre recette avec le monde",
      "inputPlaceholder": "Entrez l'URL de la recette",
      "submitButton": "Envoyer la recette",
      "invalidUrl": "URL invalide",
      "urlRequired": "L'URL est requise",
      "submitErrorTitle": "Erreur !",
      "submitErrorDescription": "Erreur lors de la création de la recette.",
      "invalidFileTypeTitle": "Type de fichier invalide",
      "invalidFileTypeDescription": "Seuls les fichiers image sont autorisés.",
      "uploadSuccessTitle": "Téléchargement réussi",
      "uploadSuccessDescription": "Votre image a été téléchargée avec succès !",
      "uploadErrorTitle": "Erreur de téléchargement",
      "uploadErrorDescription": "Échec du téléchargement de l'image."
    }
  },
  "es": {
    "landing": {
      "title": "Envía tu receta",
      "subtitle": "Comparte tu receta con el mundo",
      "inputPlaceholder": "Ingresa la URL de la receta",
      "submitButton": "Enviar Receta",
      "invalidUrl": "URL inválida",
      "urlRequired": "La URL es obligatoria",
      "submitErrorTitle": "¡Error!",
      "submitErrorDescription": "Error al crear la receta.",
      "invalidFileTypeTitle": "Tipo de archivo inválido",
      "invalidFileTypeDescription": "Solo se permiten archivos de imagen.",
      "uploadSuccessTitle": "Carga exitosa",
      "uploadSuccessDescription": "¡Tu imagen se ha cargado correctamente!",
      "uploadErrorTitle": "Error de carga",
      "uploadErrorDescription": "Error al cargar la imagen."
    }
  }
}
</i18n>
