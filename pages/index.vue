<script setup lang="ts">
definePageMeta({
  layout: "single-page",
})
</script>

<template>
  <ULandingHero
      title="Get Recipes Instantly"
      description="Paste a URL and receive a beautifully formatted recipe in seconds."
  >
    <template #default>
      <div class="mx-auto w-1/2 text-center space-y-4">
        <UInput />
        <UButton block>Get Recipe</UButton>
      </div>
    </template>
  </ULandingHero>
</template>


<style module scoped>

</style>