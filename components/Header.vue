<script setup lang="ts">
import Logo from "~/components/Logo.vue";
</script>

<template>
  <UHeader :links="[]">
    <template #logo>
      <NuxtLink to="/">
        <div class="h-10">
          <Logo />
        </div>
      </NuxtLink>
    </template>  </UHeader>
</template>

<style scoped>
</style>
