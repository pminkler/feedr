<script lang="ts" setup>
const router = useRouter();

useHead({
  title: "Feedr",
});

const links = computed(() =>
  [
    {
      id: "home",
      label: "Get Recipe",
      icon: "fa-solid:utensil-spoon",
      to: "/home",
      tooltip: {
        text: "Home",
        shortcuts: ["G", "R"],
      },
    },
  ],
);
</script>

<template>
  <UDashboardLayout>
    <UDashboardPanel :resizable="{ storage: 'local' }" collapsible>
      <UDashboardNavbar
        :ui="{ left: 'flex-1' }"
        class="!border-transparent"
        collapsible
        title="Feedr"
      >
      </UDashboardNavbar>

      <UDashboardSidebar>
        <!-- Header with Collapse Icon -->
        <template #header>
          <div class="flex items-center justify-between max-w-xs flex-1">
            <UDashboardSearchButton class="flex-1 flex" />
          </div>
        </template>

        <!-- Sidebar Links with label visibility based on isCollapsed -->
        <UDashboardSidebarLinks
          :links="links"
        />
      </UDashboardSidebar>
    </UDashboardPanel>

    <slot />

    <ClientOnly>
      <LazyUDashboardSearch :groups="groups" />
    </ClientOnly>
    <UNotifications />
  </UDashboardLayout>
</template>

<style scoped></style>
