<script setup lang="ts">
import { reactive, ref } from "vue";
import * as yup from "yup";
import { uploadData } from "aws-amplify/storage";
import { useI18n } from "vue-i18n";

const { gtag } = useGtag();
const toast = useToast();
const localePath = useLocalePath();
const route = useRoute();
const { locale } = useI18n();

const state = reactive({
  recipeUrl: route.query.url || "",
});

const submitting = ref(false);

const schema = yup.object().shape({
  recipeUrl: yup.string().url("Invalid URL").required("URL is required"),
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
      title: "Error!",
      description: "Error creating recipe.",
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
        title: "Invalid File Type",
        description: "Only image files are allowed.",
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
            title: "Upload Successful",
            description: "Your image was successfully uploaded!",
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
            title: "Upload Error",
            description: "Failed to upload image.",
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
