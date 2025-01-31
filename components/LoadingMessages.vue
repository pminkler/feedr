<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// Initialize with a random loading message by calling t('loadingMessage')
const message = ref(t("loadingMessage"));

let messageInterval: number;

// Updates the message every 5 seconds, ensuring a new one is chosen
const updateMessage = () => {
  let newMessage;
  do {
    newMessage = t("loadingMessage");
  } while (newMessage === message.value); // Ensure uniqueness

  message.value = newMessage;
};

onMounted(() => {
  messageInterval = setInterval(updateMessage, 5000);
});

onUnmounted(() => {
  clearInterval(messageInterval);
});
</script>

<template>
  <div class="flex justify-center items-center">
    <p class="text-lg font-semibold text-gray-700 animate-pulse">
      {{ message }}
    </p>
  </div>
</template>
