export default defineNuxtRouteMiddleware((to, from) => {
  const { currentUser, loading } = useAuth();
  if (loading.value) return;
  
  // Allow access to recipe and meal plan paths without authentication
  if (to.path.startsWith('/recipes/') || to.path.startsWith('/plans/')) {
    return; // Continue navigation, even for guest users
  }

  if (!currentUser.value) {
    // Optionally, store the target route to redirect after login
    return navigateTo("/login");
  }
});
