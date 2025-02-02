<script setup lang="ts">
import { reactive, ref } from "vue";
import * as yup from "yup";
import { uploadData } from "aws-amplify/storage";

const { gtag } = useGtag();
const toast = useToast();
const localePath = useLocalePath();

definePageMeta({
  layout: "single-page",
});

const state = reactive({
  recipeUrl: "",
  // You might later use a state property for previewing or storing the image data.
  // recipeImage: null,
});

const submitting = ref(false);

const schema = yup.object().shape({
  recipeUrl: yup.string().url("Invalid URL").required("URL is required"),
});

const reset = () => {
  state.recipeUrl = "";
  // If you add an image state, reset it too.
  // state.recipeImage = null;
  showRecipe.value = false;
};

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
      (await recipeStore.createRecipe({ url: state.recipeUrl })) || {};

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

// File input logic
const fileInput = ref<HTMLInputElement | null>(null);

function browseForImage() {
  fileInput.value?.click();
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    console.log("Selected file:", file);

    // Generate a UUID to rename the file.
    const uuid = crypto.randomUUID();

    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);

    fileReader.onload = async (e) => {
      const fileData = e.target?.result;
      if (fileData) {
        try {
          // Upload the file to S3 using the UUID as the filename.
          await uploadData({
            data: fileData,
            path: `picture-submissions/${uuid}`,
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
          // Create a new recipe with an empty URL and the pictureSubmissionUUID set.
          const recipeStore = useRecipe();
          const { id } = await recipeStore.createRecipe({
            url: "",
            pictureSubmissionUUID: uuid,
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
            <!-- Flex container for the input and the image upload button -->
            <UFormGroup name="recipeUrl">
              <div class="flex items-center">
                <UInput
                  v-model="state.recipeUrl"
                  :placeholder="$t('landing.inputPlaceholder')"
                  class="flex-grow"
                />
                <!-- Image browse button with an icon -->
                <UButton
                  type="button"
                  @click="browseForImage"
                  class="ml-2"
                  icon="heroicons:photo-16-solid"
                />
                <!-- Hidden file input for image selection -->
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
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
