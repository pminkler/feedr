// ~/composables/useAuth.ts
import { ref, onMounted, onBeforeUnmount } from "vue";
import { getCurrentUser } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";

export function useAuth() {
  // Use Nuxt's global state for the authenticated user
  const currentUser = useState("authUser", () => null);
  const loading = ref(false);

  // Function to fetch the current authenticated user.
  async function fetchUser() {
    loading.value = true;
    try {
      const user = await getCurrentUser();
      currentUser.value = user;
    } catch (error) {
      currentUser.value = null;
    } finally {
      loading.value = false;
    }
  }

  // Handler for auth events
  function handleAuthEvent({ payload }: { payload: any }) {
    switch (payload.event) {
      case "signedIn":
        // When a user signs in, fetch and update the current user.
        fetchUser();
        break;
      case "signedOut":
        // Clear the user state when signed out.
        currentUser.value = null;
        break;
      case "tokenRefresh":
        // Optionally, update state on token refresh.
        fetchUser();
        break;
      case "signInWithRedirect":
        // You might want to log this or perform additional actions.
        console.log("signInWithRedirect resolved:", payload.data);
        break;
      case "signInWithRedirect_failure":
        console.error("signInWithRedirect failed:", payload.data);
        break;
      // You can add more cases here as needed.
    }
  }

  let hubListenerCancel: () => void;

  onMounted(() => {
    hubListenerCancel = Hub.listen("auth", handleAuthEvent);
  });

  onBeforeUnmount(() => {
    // Clean up the listener to prevent memory leaks.
    if (hubListenerCancel) {
      hubListenerCancel();
    }
  });

  return { currentUser, loading, fetchUser };
}
