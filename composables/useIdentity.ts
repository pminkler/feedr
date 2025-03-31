import { ref, watch, computed } from 'vue';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { AuthMode } from '@aws-amplify/data-schema-types';

// Replace useState with ref for TypeScript compatibility
function useState<T>(key: string, initialValue: () => T) {
  return ref<T>(initialValue());
}
import { useAuth } from './useAuth';

export function useIdentity() {
  const { currentUser } = useAuth();
  const identityId = useState<string | null>('identityId', () => null);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  // Create a computed property for isLoggedIn
  const isLoggedIn = computed(() => !!currentUser.value);

  // Fetch the current identity ID from Cognito
  const getIdentityId = async () => {
    if (identityId.value) return identityId.value;

    isLoading.value = true;
    error.value = null;

    try {
      // Get the Cognito identity ID for the current user or guest
      const session = await fetchAuthSession();
      const cognitoIdentityId = session.identityId;

      if (cognitoIdentityId) {
        identityId.value = cognitoIdentityId;
        return cognitoIdentityId;
      }

      // If not available, return null
      return null;
    } catch (err) {
      console.error('Error fetching identity ID:', err);
      error.value = err instanceof Error ? err : new Error(String(err));
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // Get an owner ID that works for both authenticated users and guests
  const getOwnerId = async () => {
    try {
      // For both authenticated users and guests, use the Cognito identity ID
      const session = await fetchAuthSession();
      console.log('Auth session:', session);

      // Extract the identity ID from the session
      const identityId = session.identityId;
      console.log('Cognito identity ID for owner lookup:', identityId);

      if (identityId) {
        return identityId;
      }

      // Fallback to username if identity ID is not available (unlikely)
      if (isLoggedIn.value && currentUser.value?.username) {
        console.log('Fallback to username as owner ID:', currentUser.value.username);
        return currentUser.value.username;
      }

      console.warn('Could not determine identity ID or username');
      return null;
    } catch (error) {
      console.error('Error getting owner ID:', error);
      return null;
    }
  };

  /**
   * Get appropriate auth options based on user state and operation type
   *
   * This function implements the auth mode selection logic:
   * - For authenticated users: userPool auth mode
   * - For guest users: identityPool auth mode
   * - For ownership-based operations: lambda auth mode with user context
   *
   * @param options Optional settings to customize auth behavior
   * @param options.forceAuthMode Force a specific auth mode regardless of user state (deprecated, use authMode instead)
   * @param options.requiresOwnership Whether the operation involves ownership checks (uses lambda)
   * @param options.authMode Specify the exact auth mode to use
   */
  const getAuthOptions = async (options?: {
    forceAuthMode?: AuthMode;
    requiresOwnership?: boolean;
    authMode?: AuthMode;
  }) => {
    try {
      // If a specific auth mode is provided, use it
      if (options?.authMode) {
        if (options.authMode === 'lambda') {
          // For lambda mode, we still need to create an auth token
          const identityId = await getIdentityId();
          const authToken = JSON.stringify({
            identityId,
            username: currentUser.value?.username,
            timestamp: Date.now(),
          });

          return {
            authMode: 'lambda' as AuthMode,
            authToken,
          };
        }

        return { authMode: options.authMode };
      }

      // Backward compatibility for forceAuthMode
      if (options?.forceAuthMode) {
        if (options.forceAuthMode === 'lambda') {
          // For lambda mode, we still need to create an auth token
          const identityId = await getIdentityId();
          const authToken = JSON.stringify({
            identityId,
            username: currentUser.value?.username,
            timestamp: Date.now(),
          });

          return {
            authMode: 'lambda' as AuthMode,
            authToken,
          };
        }

        return { authMode: options.forceAuthMode };
      }

      // Get user identity information for decision making
      const identityId = await getIdentityId();

      // Operations requiring ownership checks should always use lambda mode
      if (options?.requiresOwnership) {
        const authToken = JSON.stringify({
          identityId,
          username: currentUser.value?.username,
          timestamp: Date.now(),
        });

        return {
          authMode: 'lambda' as AuthMode,
          authToken,
        };
      }

      // Standard auth mode selection based on user state:

      // CASE 1: Authenticated user with userPool auth mode
      if (isLoggedIn.value && currentUser.value?.username) {
        return {
          authMode: 'userPool' as AuthMode,
        };
      }

      // CASE 2: Guest user with identityPool auth mode
      else if (identityId) {
        return {
          authMode: 'identityPool' as AuthMode,
        };
      }

      // CASE 3: Fallback to lambda authorizer with empty context
      const authToken = JSON.stringify({
        timestamp: Date.now(), // Include timestamp to prevent token reuse
      });

      return {
        authMode: 'lambda' as AuthMode,
        authToken,
      };
    } catch (error) {
      console.error('Error getting auth options:', error);
      // Default fallback with empty token
      return {
        authMode: 'lambda' as AuthMode,
        authToken: JSON.stringify({ timestamp: Date.now() }),
      };
    }
  };

  // Check if the current user (authenticated or guest) is the owner of a resource
  const isResourceOwner = async (owners: string[] = []) => {
    if (!owners.length) return false;

    const ownerId = await getOwnerId();
    if (!ownerId) return false;

    return owners.includes(ownerId);
  };

  // Initialize identity ID when component is mounted
  getIdentityId();

  // Watch for changes in authentication state and refresh identity ID as needed
  watch(
    () => isLoggedIn.value,
    () => {
      // When auth state changes, refresh the identity ID
      identityId.value = null;
      getIdentityId();
    }
  );

  return {
    identityId,
    isLoading,
    error,
    isLoggedIn,
    getIdentityId,
    getOwnerId,
    isResourceOwner,
    getAuthOptions,
  };
}
