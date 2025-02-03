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
import Header from "~/components/Header.vue";
import AppFooter from "~/components/AppFooter.vue";

useHead({
  title: "Feedr",
});
</script>
