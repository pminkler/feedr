<script setup lang="ts">
import { ref, computed } from "vue";
const { locale, locales } = useI18n();
const switchLocalePath = useSwitchLocalePath();

const availableLocales = computed(() => {
  return locales.value.map((i) => ({
    label: i.name,
    value: i.code,
  }));
});

const selectedLanguage = ref(locale.value);

const changeLanguage = (newLocale: string) => {
  window.location.href = switchLocalePath(newLocale);
};
</script>

<template>
  <UHeader :links="[]">
    <template #logo> Feedr </template>

    <template #right>
      <UColorModeButton />
      <USelect
        v-model="selectedLanguage"
        :options="availableLocales"
        @change="changeLanguage($event)"
      />
    </template>
  </UHeader>
</template>
