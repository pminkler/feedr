<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();

definePageMeta({
  layout: "default",
});
</script>

<template>
  <UContainer class="w-full md:w-3/4 lg:w-3/4">
    <Recipe
      :id="
        Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
      "
    />
  </UContainer>
</template>

<style module scoped>
/* Add your styles here */
</style>
