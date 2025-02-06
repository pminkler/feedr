<script setup lang="ts">
const authStore = useAuth();
</script>

<template>
  <UHeader :links="[]">
    <template #logo> <span class="logo">Feedr</span> </template>
    <template #right> </template>
  </UHeader>
</template>

<style scoped>
.logo {
  font-family: Nunito;
}
</style>
