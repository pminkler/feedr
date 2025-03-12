<script setup lang="ts">
const route = useRoute();
const appConfig = useAppConfig();

const localePath = useLocalePath();

const links = [
  {
    id: "bookmarked",
    label: "Bookmarked Recipes",
    icon: "i-heroicons-home",
    to: localePath("bookmarks"),
    tooltip: {
      text: "Bookmarks",
      shortcuts: ["G", "B"],
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
    <UDashboardSidebar>
      <template #header>
        <UDashboardSearchButton />
      </template>

      <UNavigationMenu :items="links" orientation="vertical" />
    </UDashboardSidebar>
    <slot />
  </UDashboardGroup>
</template>
