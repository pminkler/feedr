// ~/composables/useAuth.ts
import { ref } from "vue";
import { getCurrentUser } from "aws-amplify/auth";

export function useAuth() {
  // Use Nuxt's reactive global state
  const currentUser = useState("authUser", () => null);
  const loading = ref(false);

  async function fetchUser() {
    loading.value = true;
    try {
      const user = await getCurrentUser();
      console.log("Fetched user:", user);
      currentUser.value = user;
    } catch (error) {
      console.error("Error fetching user:", error);
      currentUser.value = null;
    } finally {
      loading.value = false;
    }
  }

  return { currentUser, loading, fetchUser };
}
