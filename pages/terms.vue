<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

// Use the landing layout
definePageMeta({
  layout: 'landing',
});

const { t, locale, getLocaleMessage } = useI18n();

// Compute the updated date in local format.
const updatedDateInLocalTime = computed(() => {
  return new Date('2025-01-30T00:00:00Z').toLocaleDateString();
});

// Current year for copyright.
const currentYear = new Date().getFullYear();

// Helper function to replace placeholders in list items.
const replacePlaceholders = (text: string) => {
  return text.replace(/{appName}/g, 'Feedr');
};

// Computed properties for list arrays.
// For Section 2 (User Responsibilities)
const section2List = computed(() => {
  const messagesObj = getLocaleMessage(locale.value) as Record<string, any>;
  const list = messagesObj.termsOfService.section2.list || [];
  return list.map((item: string) => replacePlaceholders(item));
});

// For Section 6 (No Warranties)
const section6List = computed(() => {
  const messagesObj = getLocaleMessage(locale.value) as Record<string, any>;
  const list = messagesObj.termsOfService.section6.list || [];
  return list.map((item: string) => replacePlaceholders(item));
});

// For Section 7 (Limitation of Liability)
const section7List = computed(() => {
  const messagesObj = getLocaleMessage(locale.value) as Record<string, any>;
  const list = messagesObj.termsOfService.section7.list || [];
  return list.map((item: string) => replacePlaceholders(item));
});
</script>

<template>
  <div class="max-w-3xl mx-auto p-6">
    <!-- Title & Last Updated -->
    <h1 class="text-3xl font-bold mb-4">{{ t('termsOfService.title') }}</h1>
    <p class="mb-4">
      {{ t('termsOfService.lastUpdated') }}
      <span class="font-semibold">{{ updatedDateInLocalTime }}</span>
    </p>

    <!-- Intro -->
    <p class="mb-4" v-html="t('termsOfService.intro', { appName: 'Feedr' })"></p>

    <!-- Section 1: Service Description -->
    <h2 class="text-2xl font-semibold mt-6 mb-2">
      {{ t('termsOfService.section1.title') }}
    </h2>
    <p class="mb-4" v-html="t('termsOfService.section1.paragraph', { appName: 'Feedr' })"></p>

    <!-- Section 2: User Responsibilities -->
    <h2 class="text-2xl font-semibold mt-6 mb-2">
      {{ t('termsOfService.section2.title') }}
    </h2>
    <p class="mb-4" v-html="t('termsOfService.section2.paragraph', { appName: 'Feedr' })"></p>
    <ul class="list-disc list-inside mb-4">
      <li v-for="(item, index) in section2List" :key="index">
        {{ item }}
      </li>
    </ul>

    <!-- Section 3: Stored Data -->
    <h2 class="text-2xl font-semibold mt-6 mb-2">
      {{ t('termsOfService.section3.title') }}
    </h2>
    <p class="mb-4" v-html="t('termsOfService.section3.paragraph')"></p>

    <!-- Section 4: Ownership & Copyright -->
    <h2 class="text-2xl font-semibold mt-6 mb-2">
      {{ t('termsOfService.section4.title') }}
    </h2>
    <p class="mb-4" v-html="t('termsOfService.section4.paragraph')"></p>

    <!-- Section 5: Third-Party Content -->
    <h2 class="text-2xl font-semibold mt-6 mb-2">
      {{ t('termsOfService.section5.title') }}
    </h2>
    <p class="mb-4" v-html="t('termsOfService.section5.paragraph')"></p>

    <!-- Section 6: No Warranties -->
    <h2 class="text-2xl font-semibold mt-6 mb-2">
      {{ t('termsOfService.section6.title') }}
    </h2>
    <p class="mb-4" v-html="t('termsOfService.section6.paragraph', { appName: 'Feedr' })"></p>
    <ul class="list-disc list-inside mb-4">
      <li v-for="(item, index) in section6List" :key="index">
        {{ item }}
      </li>
    </ul>

    <!-- Section 7: Limitation of Liability -->
    <h2 class="text-2xl font-semibold mt-6 mb-2">
      {{ t('termsOfService.section7.title') }}
    </h2>
    <p class="mb-4" v-html="t('termsOfService.section7.paragraph', { appName: 'Feedr' })"></p>
    <ul class="list-disc list-inside mb-4">
      <li v-for="(item, index) in section7List" :key="index">
        {{ item }}
      </li>
    </ul>

    <!-- Section 8: Service Modifications -->
    <h2 class="text-2xl font-semibold mt-6 mb-2">
      {{ t('termsOfService.section8.title') }}
    </h2>
    <p class="mb-4" v-html="t('termsOfService.section8.paragraph', { appName: 'Feedr' })"></p>

    <!-- Section 9: Changes to These Terms -->
    <h2 class="text-2xl font-semibold mt-6 mb-2">
      {{ t('termsOfService.section9.title') }}
    </h2>
    <p class="mb-4" v-html="t('termsOfService.section9.paragraph', { appName: 'Feedr' })"></p>

    <!-- Copyright -->
    <p class="text-sm mt-6">
      {{ t('termsOfService.copyright', { year: currentYear, appName: 'Feedr' }) }}
    </p>
  </div>
</template>

<style module scoped>
/* Additional component-specific styles can go here */
</style>
