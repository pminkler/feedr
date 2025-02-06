export default defineNuxtRouteMiddleware((to, from) => {
  const { currentUser, loading } = useAuth();
  if (loading.value) return;

  if (!currentUser.value) {
    // Optionally, store the target route to redirect after login.
    return navigateTo("/login");
  }
});
