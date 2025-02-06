<template>
  <Header />

  <UMain>
    <UContainer>
      <UPage>
        <UPageBody>
          <slot />
        </UPageBody>
      </UPage>
    </UContainer>
  </UMain>
  <AppFooter />
</template>

<script lang="ts" setup>
useHead({
  title: "Feedr",
});
</script>
