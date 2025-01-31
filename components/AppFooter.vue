<script lang="ts" setup>
const { t: $t } = useI18n();
const localePath = useLocalePath();

const links = [
  {
    label: $t("footer.privacyPolicyLink"),
    to: localePath("/privacy"),
  },
  {
    label: $t("footer.termsOfServiceLink"),
    to: localePath("/terms"),
  },
  {
    label: $t("footer.contactLink"),
    to: localePath("/contact"),
  },
];
</script>

<template>
  <UFooter :links="links"></UFooter>
</template>
