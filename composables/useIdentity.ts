import { ref, watch } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { useState } from '#app';
import type { AuthMode } from "@aws-amplify/data-schema-types";

export function useIdentity() {
  const { currentUser, isLoggedIn } = useAuth();
  const identityId = useState<string | null>('identityId', () => null);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  
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
  
  // Get an owner ID - either the username (for authenticated users) or identity ID (for guests)
  const getOwnerId = async () => {
    // For authenticated users, use the username
    if (isLoggedIn.value && currentUser.value?.username) {
      return currentUser.value.username;
    }
    
    // For guests, use the identity ID
    return await getIdentityId();
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
   * @param options.forceAuthMode Force a specific auth mode regardless of user state
   * @param options.requiresOwnership Whether the operation involves ownership checks (uses lambda)
   */
  const getAuthOptions = async (options?: {
    forceAuthMode?: AuthMode,
    requiresOwnership?: boolean
  }) => {
    try {
      // If a specific auth mode is forced, use it
      if (options?.forceAuthMode) {
        if (options.forceAuthMode === "lambda") {
          // For lambda mode, we still need to create an auth token
          const identityId = await getIdentityId();
          const authToken = JSON.stringify({
            identityId,
            username: currentUser.value?.username,
            timestamp: Date.now()
          });
          
          return {
            authMode: "lambda" as AuthMode,
            authToken
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
          timestamp: Date.now()
        });
        
        return {
          authMode: "lambda" as AuthMode,
          authToken
        };
      }
      
      // Standard auth mode selection based on user state:
      
      // CASE 1: Authenticated user with userPool auth mode
      if (isLoggedIn.value && currentUser.value?.username) {
        return { 
          authMode: "userPool" as AuthMode 
        };
      }
      
      // CASE 2: Guest user with identityPool auth mode
      else if (identityId) {
        return { 
          authMode: "identityPool" as AuthMode 
        };
      }
      
      // CASE 3: Fallback to lambda authorizer with empty context
      const authToken = JSON.stringify({
        timestamp: Date.now() // Include timestamp to prevent token reuse
      });
      
      return { 
        authMode: "lambda" as AuthMode,
        authToken
      };
    } catch (error) {
      console.error("Error getting auth options:", error);
      // Default fallback with empty token
      return { 
        authMode: "lambda" as AuthMode,
        authToken: JSON.stringify({ timestamp: Date.now() })
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
  watch(() => isLoggedIn.value, () => {
    // When auth state changes, refresh the identity ID
    identityId.value = null;
    getIdentityId();
  });
  
  return {
    identityId,
    isLoading,
    error,
    getIdentityId,
    getOwnerId,
    isResourceOwner,
    getAuthOptions,
  };
}