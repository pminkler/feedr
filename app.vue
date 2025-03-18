<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { Hub } from "aws-amplify/utils";

const colorMode = useColorMode();

const color = computed(() =>
  colorMode.value === "dark" ? "#111827" : "white",
);

// Base SEO configuration
useHead({
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { key: "theme-color", name: "theme-color", content: color },
  ],
  link: [
    { rel: "icon", href: "/favicon.ico" },
    { rel: "canonical", href: "https://feedr.app" },
  ],
  htmlAttrs: {
    lang: "en",
  },
});

// Default SEO metadata that can be overridden by individual pages
useSeoMeta({
  title: "Feedr - Get to the Recipe",
  ogTitle: "Feedr - Get to the Recipe",
  description: "Clean, structured recipes with just ingredients and steps. Extract recipes from URLs or images.",
  ogDescription: "Clean, structured recipes with just ingredients and steps. Extract recipes from URLs or images.",
  ogImage: "https://feedr.app/web-app-manifest-512x512.png",
  twitterCard: "summary_large_image",
});
const { handleAuthEvent } = useAuth();
const appConfig = useAppConfig();

let hubListenerCancel: () => void = () => {};
onMounted(() => {
  hubListenerCancel = Hub.listen("auth", handleAuthEvent);
});

// Clean up the listener when the component using this composable unmounts.
onBeforeUnmount(() => {
  hubListenerCancel();
});
</script>

<template>
  <UApp>
    <NuxtPwaManifest />
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
