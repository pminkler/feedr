<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useNuxtApp } from "#app";
const { locale, locales } = useI18n();
const switchLocalePath = useSwitchLocalePath();

const availableLocales = computed(() => {
  return locales.value.map((i) => ({
    label: i.name,
    value: i.code,
  }));
});

const selectedLanguage = ref(locale.value);
const { $pwa } = useNuxtApp();
const isPWAInstalled = ref(false);

onMounted(() => {
  isPWAInstalled.value = $pwa?.isPWAInstalled || false;
});

const changeLanguage = (newLocale: string) => {
  window.location.href = switchLocalePath(newLocale);
};

const installApp = async () => {
  if ($pwa?.install && !$pwa.isPWAInstalled) {
    await $pwa.install();
  }
};
</script>

<template>
  <UHeader :links="[]">
    <template #logo> <span class="logo">Feedr</span> </template>

    <template #right>
      <UColorModeButton />
      <UButton
        icon="mdi:cloud-download-outline"
        v-if="!isPWAInstalled"
        @click="installApp"
      >
        Install
      </UButton>
      <USelect
        v-model="selectedLanguage"
        :options="availableLocales"
        @change="changeLanguage($event)"
      />
    </template>
  </UHeader>
</template>

<style scoped>
.logo {
  font-family: Nunito;
}
.install-btn {
  margin-right: 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
.install-btn:hover {
  background-color: #45a049;
}
</style>
