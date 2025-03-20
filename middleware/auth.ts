import { useAuth } from "~/composables/useAuth";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { currentUser, fetchUser, isLoggedIn } = useAuth();
  const localePath = useLocalePath();
  const route = useRoute();

  // Try to fetch user data if not already available
  if (!currentUser.value) {
    await fetchUser();
  }

  // If still no user after trying to fetch, redirect to login
  if (!isLoggedIn.value) {
    return navigateTo(localePath('/login'));
  }
});