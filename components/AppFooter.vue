<script lang="ts" setup>
const links = [
  {
    label: "Privacy Policy",
    to: "/privacy",
  },
  {
    label: "Terms of Service",
    to: "/terms",
  },
];
</script>

<template>
  <UFooter :links="links"></UFooter>
</template>
