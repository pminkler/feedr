<script setup lang="ts">
import { useAuth } from "~/composables/useAuth";
import { signOut } from "aws-amplify/auth";
import { useLocalePath } from "#imports";

const { currentUser } = useAuth();
const localePath = useLocalePath();

async function onSignOut() {
  try {
    await signOut();
  } catch (error) {
    console.error("Error signing out", error);
  }
}

const links = computed(() => {
  if (currentUser) {
    return [
      {
        label: "Home",
        click: localePath("/home"),
      },
    ];
  }
});
</script>

<template>
  <UHeader :links="links">
    <!-- Logo slot -->
    <template #logo>
      <NuxtLink to="/">
        <span class="logo">Feedr</span>
      </NuxtLink>
    </template>

    <!-- Right slot -->
    <template #right>
      <template v-if="!currentUser">
        <NuxtLink :to="localePath('/signup')">
          <UButton color="primary">Sign Up</UButton>
        </NuxtLink>
        <NuxtLink :to="localePath('/login')">
          <UButton variant="ghost" color="primary" class="ml-2">
            Sign In
          </UButton>
        </NuxtLink>
      </template>
      <template v-else>
        <UButton @click="onSignOut" color="primary" variant="ghost"
          >Sign Out</UButton
        >
      </template>
    </template>
  </UHeader>
</template>

<style scoped>
.logo {
  font-family: Nunito;
  font-size: 1.25rem;
  font-weight: bold;
}

.ml-2 {
  margin-left: 0.5rem;
}
</style>
