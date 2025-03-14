<script setup lang="ts">
const route = useRoute();
const appConfig = useAppConfig();

const localePath = useLocalePath();

const links = [
  {
    id: "my-recipes",
    label: "My Recipes",
    icon: "i-heroicons-document-text",
    to: localePath("my-recipes"),
    tooltip: {
      text: "My Recipes",
      shortcuts: ["G", "R"],
    },
  },
  {
    id: "plans",
    label: "Meal Plans",
    icon: "i-heroicons-calendar",
    to: localePath("plans"),
    tooltip: {
      text: "Meal Plans",
      shortcuts: ["G", "P"],
    },
  },
];
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible resizable :min-size="20">
      <template #header="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" />
      </template>

      <UNavigationMenu :items="links" orientation="vertical" />
    </UDashboardSidebar>
    <slot />
  </UDashboardGroup>
</template>
