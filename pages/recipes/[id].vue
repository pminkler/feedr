<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useRecipe } from '~/composables/useRecipe'

definePageMeta({
  layout: 'single-page',
})

const route = useRoute()
const { getRecipeById, recipesState } = useRecipe()

onMounted(async () => {
  const recipeId = route.params.id as string
  await getRecipeById(recipeId)
})

const recipe = computed(() => recipesState.value[route.params.id])
</script>

<template>
  <div v-if="recipe">
    <h1>{{ recipe.url }}</h1>
  </div>
  <div v-else>
    <p>Loading...</p>
  </div>
</template>

<style module scoped>
/* Add your styles here */
</style>