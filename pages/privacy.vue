<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// Use the layout you want
definePageMeta({
  layout: "single-page",
});

const { t } = useI18n();

// Compute the updated date in local format
const updatedDateInLocalTime = computed(() => {
  return new Date("2025-01-30T00:00:00Z").toLocaleDateString();
});

// Compute the current year for the copyright notice
const currentYear = new Date().getFullYear();
</script>

<template>
  <div class="max-w-3xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-4">
      {{ t("privacyPolicy.title") }}
    </h1>
    <p class="mb-4">
      {{ t("privacyPolicy.lastUpdated") }}
      <span class="font-semibold">{{ updatedDateInLocalTime }}</span>
    </p>

    <!-- Introductory paragraph -->
    <p class="mb-4" v-html="t('privacyPolicy.intro', { appName: 'Feedr' })"></p>

    <!-- Section 1 -->
    <h2 class="text-2xl font-semibold mt-6 mb-2">
      {{ t("privacyPolicy.section1.title") }}
    </h2>
    <p
      class="mb-4"
      v-html="t('privacyPolicy.section1.paragraph1', { appName: 'Feedr' })"
    ></p>
    <p
      class="mb-4"
      v-html="t('privacyPolicy.section1.paragraph2', { appName: 'Feedr' })"
    ></p>

    <!-- Section 2 -->
    <h2 class="text-2xl font-semibold mt-6 mb-2">
      {{ t("privacyPolicy.section2.title") }}
    </h2>
    <p
      class="mb-4"
      v-html="t('privacyPolicy.section2.paragraph', { appName: 'Feedr' })"
    ></p>

    <!-- Section 3 -->
    <h2 class="text-2xl font-semibold mt-6 mb-2">
      {{ t("privacyPolicy.section3.title") }}
    </h2>
    <p class="mb-4" v-html="t('privacyPolicy.section3.paragraph')"></p>

    <!-- Section 4 -->
    <h2 class="text-2xl font-semibold mt-6 mb-2">
      {{ t("privacyPolicy.section4.title") }}
    </h2>
    <p
      class="mb-4"
      v-html="t('privacyPolicy.section4.paragraph', { appName: 'Feedr' })"
    ></p>

    <!-- Section 5 -->
    <h2 class="text-2xl font-semibold mt-6 mb-2">
      {{ t("privacyPolicy.section5.title") }}
    </h2>
    <p
      class="mb-4"
      v-html="t('privacyPolicy.section5.paragraph', { appName: 'Feedr' })"
    ></p>

    <!-- Section 6 -->
    <h2 class="text-2xl font-semibold mt-6 mb-2">
      {{ t("privacyPolicy.section6.title") }}
    </h2>
    <p
      class="mb-4"
      v-html="t('privacyPolicy.section6.paragraph', { appName: 'Feedr' })"
    ></p>

    <!-- Section 7 -->
    <h2 class="text-2xl font-semibold mt-6 mb-2">
      {{ t("privacyPolicy.section7.title") }}
    </h2>
    <p class="mb-4" v-html="t('privacyPolicy.section7.paragraph')"></p>

    <!-- Copyright -->
    <p class="text-sm mt-6">
      {{
        t("privacyPolicy.copyright", { year: currentYear, appName: "Feedr" })
      }}
    </p>
  </div>
</template>

<style module scoped>
/* You can add any additional component-specific styles here */
</style>
