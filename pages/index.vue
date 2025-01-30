<script setup lang="ts">
import { reactive, ref } from "vue";
import * as yup from "yup";

const { gtag } = useGtag();
const toast = useToast();

definePageMeta({
  layout: "single-page",
});

const state = reactive({
  recipeUrl: "",
});

const submitting = ref(false);

const schema = yup.object().shape({
  recipeUrl: yup.string().url("Invalid URL").required("URL is required"),
});

const reset = () => {
  state.recipeUrl = "";
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
      navigateTo(`/recipes/${id}`);
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
</script>

<template>
  <div>
    <ULandingHero
      title="Get Recipes in a Flash"
      description="Paste a URL to a recipe and receive a beautifully formatted recipe in seconds."
    >
      <template #default>
        <div class="mx-auto w-full md:w-1/2 text-center space-y-4">
          <UForm
            :validate="validate"
            :state="state"
            class="space-y-4"
            @submit="onSubmit"
          >
            <UFormGroup name="recipeUrl">
              <UInput v-model="state.recipeUrl" placeholder="Recipe URL" />
            </UFormGroup>
            <UButton type="submit" :loading="submitting" block
              >Get Recipe</UButton
            >
          </UForm>
        </div>
      </template>
    </ULandingHero>
  </div>
</template>
