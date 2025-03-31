import { useAuth } from '~/composables/useAuth';

/**
 * Plugin to handle authentication
 * Allows both authenticated users and guests to use the app
 */
export default defineNuxtPlugin((nuxtApp) => {
  const { ensureAuthenticated, currentUser } = useAuth();

  // Register a function that can be used when authenticated user is preferred but not required
  nuxtApp.provide('tryAuth', async () => {
    try {
      // Try to authenticate but don't throw if it fails
      await ensureAuthenticated().catch((err: Error) => {
        console.log('User not authenticated, continuing as guest', err);
      });

      return currentUser.value;
    } catch (error) {
      console.log('Using guest mode:', error);
      return null;
    }
  });

  // Register a function for operations that absolutely require authentication
  nuxtApp.provide('ensureAuth', async () => {
    try {
      const user = await ensureAuthenticated();

      if (!user) {
        console.error('Auto-auth failed: No user returned from ensureAuthenticated');
        throw new Error('Authentication required for this operation');
      }

      return user;
    } catch (error) {
      console.error('Error in ensureAuth:', error);
      throw error;
    }
  });
});
