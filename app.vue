<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { Hub } from "aws-amplify/utils";

const { handleAuthEvent } = useAuth();

let hubListenerCancel: () => void = () => {};
onMounted(() => {
  hubListenerCancel = Hub.listen("auth", handleAuthEvent);
});

// Clean up the listener when the component using this composable unmounts.
onBeforeUnmount(() => {
  hubListenerCancel();
});

useHead({
  title: "Feedr",
});
</script>

<template>
  <div>
    <NuxtPwaManifest />
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <UNotifications />
    <UModals />
  </div>
</template>
