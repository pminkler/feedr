<script lang="ts" setup>
import Logo from "~/components/Logo.vue";

useHead({
  title: "Feedr",
});
const localePath = useLocalePath();

const links = computed(() => [
  {
    id: "home",
    label: "Your Recipes",
    icon: "mdi:book-open-page-variant",
    to: localePath("/home"),
    tooltip: {
      text: "Home",
      shortcuts: ["G", "R"],
    },
  },
]);
</script>

<template>
  <UDashboardLayout>
    <UDashboardPanel :resizable="{ storage: 'local' }" collapsible>
      <UDashboardNavbar
        :ui="{ left: 'flex-1' }"
        class="!border-transparent"
        collapsible
      >
        <template #title>
          <div class="h-10">
            <ULink :to="localePath('/')">
              <Logo />
            </ULink>
          </div>
        </template>
      </UDashboardNavbar>

      <UDashboardSidebar>
        <UDashboardSidebarLinks :links="links" />
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
