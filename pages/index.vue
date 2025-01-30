<script setup lang="ts">
import { reactive, ref } from "vue";
import * as yup from "yup";
import { useRecipe } from "~/composables/useRecipe";

definePageMeta({
  layout: "single-page",
});

const state = reactive({
  recipeUrl: "",
});

const showRecipe = ref(false);
const isLoading = ref(false);

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

async function onSubmit(event: FormSubmitEvent<any>) {
  isLoading.value = true;
  showRecipe.value = true;
  isLoading.value = false;
}
</script>

<template>
  <div>
    <ULandingHero
      v-if="!showRecipe"
      title="Get Recipes Instantly"
      description="Paste a URL and receive a beautifully formatted recipe in seconds."
    >
      <template #default>
        <div class="mx-auto w-1/2 text-center space-y-4">
          <UForm
            :validate="validate"
            :state="state"
            class="space-y-4"
            @submit="onSubmit"
          >
            <UFormGroup name="recipeUrl">
              <UInput v-model="state.recipeUrl" placeholder="Recipe URL" />
            </UFormGroup>
            <UButton :loading="isLoading" type="submit" block
              >Get Recipe</UButton
            >
          </UForm>
        </div>
      </template>
    </ULandingHero>
    <Recipe v-else :url="state.recipeUrl" />
  </div>
</template>
