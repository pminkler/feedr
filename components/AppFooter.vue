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
  {
    label: "Contact",
    to: "/contact",
  },
];
</script>

<template>
  <UFooter :links="links"></UFooter>
</template>
