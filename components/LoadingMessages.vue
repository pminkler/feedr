<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const { getRandomMessage } = useLoadingMessages();
const message = ref(getRandomMessage());
let messageInterval: number;

// Updates the message every 5 seconds, ensuring a new one is chosen
const updateMessage = () => {
  let newMessage;
  do {
    newMessage = getRandomMessage();
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
