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
  }
];
</script>

<template>
  <UDashboardLayout>
    <UDashboardPanel
      :width="250"
      :resizable="{ min: 200, max: 300 }"
      collapsible
    >
      <UDashboardNavbar class="!border-transparent" :ui="{ left: 'flex-1' }">
        <template #left>
          <ULink class="h-10" to="/">
            <Logo />
          </ULink>
        </template>
      </UDashboardNavbar>

      <UDashboardSidebar>
        <template #header>
          <UDashboardSearchButton />
        </template>

        <UDashboardSidebarLinks :links="links" />

        <template #footer> </template>
      </UDashboardSidebar>
    </UDashboardPanel>

    <slot />
  </UDashboardLayout>
</template>