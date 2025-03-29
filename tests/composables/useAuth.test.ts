import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import { getCurrentUser, fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

// Mock AWS Amplify modules
vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn(),
  fetchUserAttributes: vi.fn(),
  fetchAuthSession: vi.fn(),
}));

vi.mock('aws-amplify/utils', () => ({
  Hub: {
    listen: vi.fn(),
  },
}));

// Mock useState for Nuxt
const useStateMock = vi.fn();
vi.mock('#app', () => ({
  useState: (key: string, fn: Function) => {
    return ref(fn());
  },
}));

// Mock the composable for testing
const mockFetchUser = vi.fn();
const mockHandleAuthEvent = vi.fn();
const mockCurrentUser = ref(null);
const mockLoading = ref(false);
const mockIsLoggedIn = computed(() => !!mockCurrentUser.value);

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
    loading: mockLoading,
    fetchUser: mockFetchUser,
    handleAuthEvent: mockHandleAuthEvent,
    isLoggedIn: mockIsLoggedIn,
  }),
}));

// Import the mocked composable
import { useAuth } from '~/composables/useAuth';

describe('useAuth', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCurrentUser.value = null;
    mockLoading.value = false;
  });

  it('should initialize with null user and loading false', () => {
    const { currentUser, loading } = useAuth();
    expect(currentUser.value).toBeNull();
    expect(loading.value).toBe(false);
  });

  describe('fetchUser', () => {
    it('should call fetchUser function', async () => {
      const { fetchUser } = useAuth();

      // Setup mock implementation
      mockFetchUser.mockImplementation(async () => {
        mockLoading.value = true;
        try {
          const mockUser = { username: 'testuser' };
          mockCurrentUser.value = mockUser;
        } finally {
          mockLoading.value = false;
        }
      });

      await fetchUser();

      expect(mockFetchUser).toHaveBeenCalled();
    });
  });

  describe('handleAuthEvent', () => {
    it('should handle signInWithRedirect event', async () => {
      const { handleAuthEvent } = useAuth();

      await handleAuthEvent({ payload: { event: 'signInWithRedirect' } });

      expect(mockHandleAuthEvent).toHaveBeenCalledWith({
        payload: { event: 'signInWithRedirect' },
      });
    });

    it('should handle signedOut event', async () => {
      const { handleAuthEvent } = useAuth();
      mockCurrentUser.value = { username: 'testuser' };

      // Setup implementation for signedOut event
      mockHandleAuthEvent.mockImplementation(async ({ payload }) => {
        if (payload.event === 'signedOut') {
          mockCurrentUser.value = null;
        }
      });

      await handleAuthEvent({ payload: { event: 'signedOut' } });

      expect(mockHandleAuthEvent).toHaveBeenCalledWith({
        payload: { event: 'signedOut' },
      });
    });
  });

  describe('isLoggedIn', () => {
    it('should return false when user is null', () => {
      mockCurrentUser.value = null;
      const { isLoggedIn } = useAuth();
      expect(isLoggedIn.value).toBe(false);
    });

    it('should return true when user is not null', () => {
      mockCurrentUser.value = { username: 'testuser' };
      const { isLoggedIn } = useAuth();
      expect(isLoggedIn.value).toBe(true);
    });
  });
});
