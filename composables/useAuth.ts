// ~/composables/useAuth.ts
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useState } from "#app";
import { type AuthUser, getCurrentUser } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";

export const useAuth = () => {
  // Use Nuxt's global state for the authenticated user.
  // This state is only initialized when called within a proper Nuxt context.
  const currentUser = useState<AuthUser | null>("authUser", () => null);
  const loading = ref(false);

  // Fetch the current authenticated user.
  const fetchUser = async () => {
    loading.value = true;
    try {
      const user = await getCurrentUser();
      currentUser.value = user;
    } catch (error) {
      currentUser.value = null;
    } finally {
      loading.value = false;
    }
  };

  // Handle auth events from AWS Amplify's Hub.
  const handleAuthEvent = ({ payload }: { payload: any }) => {
    switch (payload.event) {
      case "signedIn":
        fetchUser();
        break;
      case "signedOut":
        currentUser.value = null;
        break;
      case "tokenRefresh":
        fetchUser();
        break;
      // Additional cases can be added here if needed.
      default:
        break;
    }
  };

  // Set up the auth listener when in a proper Nuxt/Vue context.
  let hubListenerCancel: () => void = () => {};
  onMounted(() => {
    hubListenerCancel = Hub.listen("auth", handleAuthEvent);
  });

  // Clean up the listener when the component using this composable unmounts.
  onBeforeUnmount(() => {
    hubListenerCancel();
  });

  return { currentUser, loading, fetchUser };
};
