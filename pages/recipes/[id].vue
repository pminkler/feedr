<script setup lang="ts">
import { useRoute } from "vue-router";
import { onBeforeMount } from "vue";
import Recipe from "../../components/Recipe.vue";

const route = useRoute();
const { isLoggedIn } = useAuth();

definePageMeta({
  layout: "default",
});

onBeforeMount(() => {
  if (isLoggedIn) {
    setPageLayout("dashboard");
  }
});
</script>

<template>
  <!--Logged Out-->
  <UContainer class="w-full md:w-3/4 lg:w-3/4" v-if="!isLoggedIn">
    <Recipe
      :id="
        Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
      "
    />
  </UContainer>

  <!--Logged In-->
  <UDashboardPage v-else>
    <UDashboardPanel grow>
      <UDashboardPanelContent>
        <Recipe
          :id="
            Array.isArray(route.params.id)
              ? route.params.id[0]
              : route.params.id
          "
        />
      </UDashboardPanelContent>
    </UDashboardPanel>
  </UDashboardPage>
</template>

<style module scoped>
/* Add your styles here */
</style>
