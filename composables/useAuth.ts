import 'aws-amplify/auth/enable-oauth-listener';
import { computed, ref } from 'vue';
import { type AuthUser, getCurrentUser } from 'aws-amplify/auth';

// Create shared reactive state that persists between component instances
const currentUser = ref<AuthUser | null>(null);
const loading = ref(false);
const isLoggedIn = computed(() => !!currentUser.value);

export const useAuth = () => {
  // Fetch the current authenticated user.
  const fetchUser = async () => {
    loading.value = true;
    try {
      currentUser.value = await getCurrentUser();
      console.log('Set current user:', currentUser.value);
    }
    catch {
      currentUser.value = null;
    }
    finally {
      loading.value = false;
    }
  };

  // Handle auth events from AWS Amplify's Hub.
  const handleAuthEvent = async (event: {
    payload: { event: string; data?: unknown };
  }) => {
    const { payload } = event;

    switch (payload.event) {
      case 'signInWithRedirect':
        await fetchUser();
        break;
      case 'signInWithRedirect_failure':
        break;
      case 'customOAuthState': {
        break;
      }
      case 'signedIn':
        await fetchUser();
        break;
      case 'signedOut':
        currentUser.value = null;
        break;
      case 'tokenRefresh':
        await fetchUser();
        break;
      // Additional cases can be added here if needed.
      default:
        break;
    }

    // Return the event type for consumers of this handler
    return payload.event;
  };

  // Ensure authenticated function for plugins
  const ensureAuthenticated = async () => {
    try {
      await fetchUser();
      return currentUser.value;
    }
    catch (error) {
      console.error('Authentication failed:', error);
      return null;
    }
  };

  return {
    currentUser,
    loading,
    fetchUser,
    handleAuthEvent,
    isLoggedIn,
    ensureAuthenticated,
  };
};
