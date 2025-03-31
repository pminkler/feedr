import 'aws-amplify/auth/enable-oauth-listener';
import { computed, ref } from 'vue';
import { useState } from '#app';
import {
  type AuthUser,
  getCurrentUser,
  fetchUserAttributes,
  fetchAuthSession,
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

export const useAuth = () => {
  // Use Nuxt's global state for the authenticated user.
  // This state is only initialized when called within a proper Nuxt context.
  const currentUser = useState<AuthUser | null>('authUser', () => null);
  const currentUserAttributes = useState('authUserAttributes', () => null);
  const loading = ref(false);

  // Fetch the current authenticated user.
  const fetchUser = async () => {
    loading.value = true;
    try {
      const authSession = await fetchAuthSession();
      console.log({ authSession });
      const user = await getCurrentUser();
      const currentUserAttributes = await fetchUserAttributes();
      currentUser.value = user;
    } catch (error) {
      currentUser.value = null;
    } finally {
      loading.value = false;
    }
  };

  // Handle auth events from AWS Amplify's Hub.
  const handleAuthEvent = async (event: { payload: any }) => {
    const { payload } = event;
    switch (payload.event) {
      case 'signInWithRedirect':
        await fetchUser();
        break;
      case 'signInWithRedirect_failure':
        break;
      case 'customOAuthState':
        const state = payload.data;
        console.log(state);
        break;
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

  const isLoggedIn = computed(() => !!currentUser.value);

  return { currentUser, loading, fetchUser, handleAuthEvent, isLoggedIn };
};
