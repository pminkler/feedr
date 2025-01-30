<script setup lang="ts">
import { useRoute } from "vue-router";

definePageMeta({
  layout: "single-page",
});

const route = useRoute();
</script>

<template>
  <UContainer class="w-full md:w-3/4 lg:w-1/2">
    <Recipe :id="route.params.id" />
  </UContainer>
</template>

<style module scoped>
/* Add your styles here */
</style>
