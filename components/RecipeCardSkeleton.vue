<script setup lang="ts">
const props = defineProps({
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
      <USkeleton class="h-6 w-full" v-if="useTitle" />
      <div class="space-y-2">
        <USkeleton
          :class="[useParagraphs ? 'h-20 w-full' : 'h-4 w-1/2']"
          v-for="i in lineCount"
          :key="i"
        />
      </div>
    </div>
  </UPageCard>
</template>

<style module scoped></style>
