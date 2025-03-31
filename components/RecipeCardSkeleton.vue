<script setup lang="ts">
defineProps({
  useTitle: {
    type: Boolean,
    default: true,
  },
  lineCount: {
    type: Number,
    default: 3,
  },
  useParagraphs: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <UPageCard>
    <div class="space-y-4">
      <USkeleton v-if="useTitle" class="h-6 w-full" />
      <div class="space-y-2">
        <USkeleton
          v-for="i in lineCount"
          :key="i"
          :class="[useParagraphs ? 'h-20 w-full' : 'h-4 w-1/2']"
        />
      </div>
    </div>
  </UPageCard>
</template>

<style module scoped></style>
