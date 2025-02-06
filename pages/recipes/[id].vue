<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();
const { currentUser } = useAuth();

definePageMeta({
  layout: "default",
});
</script>

<template>
  <UContainer class="w-full md:w-3/4 lg:w-3/4">
    <Recipe :id="route.params.id" />
  </UContainer>
</template>

<style module scoped>
/* Add your styles here */
</style>
