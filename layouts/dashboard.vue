<script setup lang="ts">
const route = useRoute();
const appConfig = useAppConfig();

const localePath = useLocalePath();

const links = [
  {
    id: "bookmarked",
    label: "Bookmarked Recipes",
    icon: "i-heroicons-bookmark",
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
    <UDashboardSidebar
      resizable
      collapsible
      :min-size="18"
      :default-size="35"
      :max-size="40"
      :collapsed-size="5.5"
    >
      <template #header="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" />
      </template>

      <UNavigationMenu :items="links" orientation="vertical" />
    </UDashboardSidebar>
    <slot />
  </UDashboardGroup>
</template>
