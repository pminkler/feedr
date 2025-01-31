<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const { getRandomMessage } = useLoadingMessages();
const message = ref(getRandomMessage());
const isVisible = ref(true);
let messageInterval: number;

// Picks a new message once the old one fully disappears
const onAfterLeave = () => {
  let newMessage;
  do {
    newMessage = getRandomMessage();
  } while (newMessage === message.value); // Ensure uniqueness

  message.value = newMessage; // Set new message while hidden
  isVisible.value = true; // Trigger fade-in
};

onMounted(() => {
  messageInterval = setInterval(() => {
    isVisible.value = false; // Start fade-out
  }, 5000); // Wait 5s before hiding
});

onUnmounted(() => {
  clearInterval(messageInterval);
});
</script>

<template>
  <div class="flex justify-center items-center">
    <Transition name="fade" @after-leave="onAfterLeave">
      <p
        v-if="isVisible"
        :key="message"
        class="text-lg font-semibold text-gray-700 animate-pulse"
      >
        {{ message }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
/* Vue transition for fade out/in */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease-in-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
