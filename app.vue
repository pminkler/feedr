<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { Hub } from "aws-amplify/utils";

const colorMode = useColorMode();

const color = computed(() =>
  colorMode.value === "dark" ? "#111827" : "white",
);

useHead({
  meta: [
    { charset: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { key: "theme-color", name: "theme-color", content: color },
  ],
  link: [{ rel: "icon", href: "/favicon.ico" }],
  htmlAttrs: {
    lang: "en",
  },
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
