<script setup lang="ts">
import LogoColor from '../components/LogoColor.vue';
import LogoBlack from '../components/LogoBlack.vue';
defineOptions({
  name: 'AppLogo',
});

const colorMode = useColorMode();
</script>

<template>
  <LogoColor v-if="colorMode.value === 'dark'" />
  <LogoBlack v-else />
</template>

<style module scoped></style>
