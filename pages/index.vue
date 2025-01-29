<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '#ui/types'
import { ref, reactive } from 'vue'
import * as yup from 'yup'
import { useRouter } from 'vue-router'
import { useRecipe } from '~/composables/useRecipe'

definePageMeta({
  layout: 'single-page',
})

const state = reactive({
  recipeUrl: ''
})

const schema = yup.object().shape({
  recipeUrl: yup.string().url('Invalid URL').required('URL is required')
})

const validate = async (state: any): Promise<FormError[]> => {
  try {
    await schema.validate(state, { abortEarly: false })
    return []
  } catch (validationErrors) {
    return validationErrors.inner.map((error: yup.ValidationError) => ({
      path: error.path,
      message: error.message
    }))
  }
}

const router = useRouter()

async function onSubmit(event: FormSubmitEvent<any>) {
  const recipe = useRecipe()
  const response = await recipe.createRecipe({ url: state.recipeUrl })
  if (response && response.id) {
    router.push(`/recipes/${response.id}`)
  }
}
</script>

<template>
  <ULandingHero
      title="Get Recipes Instantly"
      description="Paste a URL and receive a beautifully formatted recipe in seconds."
  >
    <template #default>
      <div class="mx-auto w-1/2 text-center space-y-4">
        <UForm :validate="validate" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormGroup name="recipeUrl">
            <UInput v-model="state.recipeUrl" placeholder="Recipe URL"/>
          </UFormGroup>
          <UButton type="submit" block>Get Recipe</UButton>
        </UForm>
      </div>
    </template>
  </ULandingHero>
</template>