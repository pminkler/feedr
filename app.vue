<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { Hub } from 'aws-amplify/utils';

const colorMode = useColorMode();

const color = computed(() => (colorMode.value === 'dark' ? '#111827' : 'white'));

// Base SEO configuration
useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color },
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
    { rel: 'canonical', href: 'https://feedr.app' },
  ],
  htmlAttrs: {
    lang: 'en',
  },
});

// Default SEO metadata that can be overridden by individual pages
useSeoMeta({
  title: 'Feedr - Get to the Recipe',
  ogTitle: 'Feedr - Get to the Recipe',
  description:
    'Clean, structured recipes with just ingredients and steps. Extract recipes from URLs or images.',
  ogDescription:
    'Clean, structured recipes with just ingredients and steps. Extract recipes from URLs or images.',
  ogImage: 'https://feedr.app/web-app-manifest-512x512.png',
  twitterCard: 'summary_large_image',
});

const { handleAuthEvent } = useAuth();
const { subscribeToMyRecipes, unsubscribeFromMyRecipes } = useRecipe();
const appConfig = useAppConfig();

// Custom auth event handler that also manages recipe subscriptions
const handleAppAuthEvent = async (event: { payload: any }) => {
  // First, handle standard auth events
  await handleAuthEvent(event);

  // Then, reset recipe subscription based on auth events
  switch (event.payload.event) {
    case 'signedIn':
    case 'tokenRefresh':
    case 'signInWithRedirect':
      // These are cases where we want to refresh the subscription
      console.log(`Auth event ${event.payload.event}: Refreshing recipe subscription`);
      subscribeToMyRecipes();
      break;
    case 'signedOut':
      // When signed out, we still want a subscription for guest recipes
      console.log(
        `Auth event ${event.payload.event}: Refreshing recipe subscription for guest mode`
      );
      subscribeToMyRecipes();
      break;
    default:
      break;
  }
};

let hubListenerCancel: () => void = () => {};

onMounted(() => {
  // Set up auth event listener with our custom handler
  hubListenerCancel = Hub.listen('auth', handleAppAuthEvent);

  // Initialize recipe subscription on app load
  console.log('App mounted: Starting initial recipe subscription');
  subscribeToMyRecipes();
});

// Clean up all listeners and subscriptions when the app unmounts
onBeforeUnmount(() => {
  hubListenerCancel();
  unsubscribeFromMyRecipes();
});
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
