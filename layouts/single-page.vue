<template>
  <UContainer>
    <UPage>
      <UPageBody>
        <slot />
      </UPageBody>
    </UPage>
  </UContainer>
</template>

<script lang="ts" setup>
useHead({
  title: "Feedr",
});
</script>
