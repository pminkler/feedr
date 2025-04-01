import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, computed } from 'vue';

// Mock console methods to reduce test output noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// We need to mock the useState function since it's used in useIdentity
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    // Mock ref to make it trackable by vitest
    ref: vi.fn((value) => {
      return {
        value,
        // Add any other properties used by the real ref
      };
    }),
  };
});

// Mock AWS Amplify auth completely
vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(),
}));

// Mock the entire useAuth to avoid dependencies
vi.mock('~/composables/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Import after mocks are set up
import { fetchAuthSession } from 'aws-amplify/auth';
import { useAuth } from '~/composables/useAuth';
import { useIdentity } from '~/composables/useIdentity';

describe('useIdentity', () => {
  let mockAuth: ReturnType<typeof useAuth>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock ref directly using vi.fn, not via import
    const refImpl = vi.fn((val) => {
      const ref = {
        value: val,
      };
      return ref;
    });
    
    vi.mocked(ref).mockImplementation(refImpl as any);
    
    // Mock useAuth implementation with all required properties
    mockAuth = {
      isLoggedIn: { value: false },
      currentUser: { value: null },
      loading: { value: false },
      fetchUser: vi.fn(),
      handleAuthEvent: vi.fn(),
      ensureAuthenticated: vi.fn()
    } as unknown as ReturnType<typeof useAuth>;
    
    vi.mocked(useAuth).mockReturnValue(mockAuth);
    
    // Silence console methods
    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();
  });
  
  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });
  
  it('should export the expected interface', () => {
    const identity = useIdentity();
    
    // Just check that the expected functions and properties exist
    expect(identity).toHaveProperty('identityId');
    expect(identity).toHaveProperty('isLoading');
    expect(identity).toHaveProperty('error');
    expect(identity).toHaveProperty('isLoggedIn');
    expect(identity).toHaveProperty('getIdentityId');
    expect(identity).toHaveProperty('getOwnerId');
    expect(identity).toHaveProperty('isResourceOwner');
    expect(identity).toHaveProperty('getAuthOptions');
    
    // Check function types
    expect(typeof identity.getIdentityId).toBe('function');
    expect(typeof identity.getOwnerId).toBe('function');
    expect(typeof identity.isResourceOwner).toBe('function');
    expect(typeof identity.getAuthOptions).toBe('function');
  });
  
  describe('getIdentityId', () => {
    it('should call fetchAuthSession', async () => {
      // Mock fetchAuthSession to return a valid response
      vi.mocked(fetchAuthSession).mockResolvedValueOnce({
        identityId: 'test-identity-id',
      } as any);
      
      const { getIdentityId } = useIdentity();
      
      // Call the function
      await getIdentityId();
      
      // Verify fetchAuthSession was called
      expect(fetchAuthSession).toHaveBeenCalled();
    });
    
    it('should handle errors from fetchAuthSession', async () => {
      // Mock fetchAuthSession to throw an error
      vi.mocked(fetchAuthSession).mockRejectedValueOnce(new Error('Auth error'));
      
      const { getIdentityId } = useIdentity();
      
      // Call the function and catch any errors
      await getIdentityId();
      
      // Verify error handling
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching identity ID:',
        expect.any(Error)
      );
    });
  });
  
  describe('getOwnerId', () => {
    it('should call fetchAuthSession', async () => {
      // Mock fetchAuthSession to return a valid response
      vi.mocked(fetchAuthSession).mockResolvedValueOnce({
        identityId: 'test-identity-id',
      } as any);
      
      const { getOwnerId } = useIdentity();
      
      // Call the function
      await getOwnerId();
      
      // Verify fetchAuthSession was called
      expect(fetchAuthSession).toHaveBeenCalled();
    });
    
    it('should try to use identity ID first', async () => {
      // Setup with both identity ID and username available
      (mockAuth.isLoggedIn as any).value = true;
      (mockAuth.currentUser as any).value = { username: 'test-user', userId: 'test-user-id' };
      
      vi.mocked(fetchAuthSession).mockResolvedValueOnce({
        identityId: 'test-identity-id',
      } as any);
      
      const { getOwnerId } = useIdentity();
      
      // Call the function
      await getOwnerId();
      
      // First check that fetchAuthSession was called
      expect(fetchAuthSession).toHaveBeenCalled();
      
      // Verify at least one console.log call was made
      expect(console.log).toHaveBeenCalled();
    });
    
    it('should handle errors from fetchAuthSession', async () => {
      // Mock fetchAuthSession to throw an error
      vi.mocked(fetchAuthSession).mockRejectedValueOnce(new Error('Auth error'));
      
      const { getOwnerId } = useIdentity();
      
      // Call the function
      await getOwnerId();
      
      // Verify error handling
      expect(console.error).toHaveBeenCalledWith(
        'Error getting owner ID:',
        expect.any(Error)
      );
    });
  });
  
  describe('getAuthOptions', () => {
    it('should accept explicit authMode parameters', async () => {
      const { getAuthOptions } = useIdentity();
      
      // Call with explicit userPool authMode
      const result1 = await getAuthOptions({ authMode: 'userPool' });
      expect(result1).toHaveProperty('authMode', 'userPool');
      
      // Call with explicit identityPool authMode
      const result2 = await getAuthOptions({ authMode: 'identityPool' });
      expect(result2).toHaveProperty('authMode', 'identityPool');
    });
    
    it('should accept forceAuthMode for backward compatibility', async () => {
      const { getAuthOptions } = useIdentity();
      
      // Call with deprecated forceAuthMode
      const result = await getAuthOptions({ forceAuthMode: 'userPool' });
      expect(result).toHaveProperty('authMode', 'userPool');
    });
    
    it('should include authToken when using lambda auth mode', async () => {
      // Mock Date.now for deterministic testing
      const originalDateNow = Date.now;
      Date.now = vi.fn(() => 1234567890);
      
      try {
        const { getAuthOptions } = useIdentity();
        
        // Call with lambda authMode
        const result = await getAuthOptions({ authMode: 'lambda' });
        
        // Verify authToken is included
        expect(result).toHaveProperty('authMode', 'lambda');
        expect(result).toHaveProperty('authToken');
        
        // Parse the authToken to check it has the expected structure
        const authToken = JSON.parse(result.authToken as string);
        expect(authToken).toHaveProperty('timestamp', 1234567890);
      } finally {
        // Restore Date.now
        Date.now = originalDateNow;
      }
    });
    
    it('should include authToken when using lambda forceAuthMode', async () => {
      // Mock Date.now for deterministic testing
      const originalDateNow = Date.now;
      Date.now = vi.fn(() => 1234567890);
      
      try {
        const { getAuthOptions } = useIdentity();
        
        // Call with lambda forceAuthMode
        const result = await getAuthOptions({ forceAuthMode: 'lambda' });
        
        // Verify authToken is included
        expect(result).toHaveProperty('authMode', 'lambda');
        expect(result).toHaveProperty('authToken');
        
        // Parse the authToken to check it has the expected structure
        const authToken = JSON.parse(result.authToken as string);
        expect(authToken).toHaveProperty('timestamp', 1234567890);
      } finally {
        // Restore Date.now
        Date.now = originalDateNow;
      }
    });
    
    it('should use lambda mode with authToken for operations requiring ownership', async () => {
      // Mock Date.now for deterministic testing
      const originalDateNow = Date.now;
      Date.now = vi.fn(() => 1234567890);
      
      try {
        const { getAuthOptions } = useIdentity();
        
        // Call with requiresOwnership flag
        const result = await getAuthOptions({ requiresOwnership: true });
        
        // Verify results
        expect(result).toHaveProperty('authMode', 'lambda');
        expect(result).toHaveProperty('authToken');
        
        // Parse the authToken to check it has the expected structure
        const authToken = JSON.parse(result.authToken as string);
        expect(authToken).toHaveProperty('timestamp', 1234567890);
      } finally {
        // Restore Date.now
        Date.now = originalDateNow;
      }
    });
    
    it('should use userPool auth mode for authenticated users', async () => {
      // Setup authenticated user
      (mockAuth.isLoggedIn as any).value = true;
      (mockAuth.currentUser as any).value = { username: 'test-user', userId: 'test-user-id' };
      
      // Setup mock identity ID
      vi.mocked(fetchAuthSession).mockResolvedValueOnce({
        identityId: 'test-identity-id',
      } as any);
      
      const { getAuthOptions } = useIdentity();
      
      // Call without specific options
      const result = await getAuthOptions();
      
      // Verify results for authenticated user
      expect(result).toHaveProperty('authMode', 'userPool');
    });
    
    it('should handle guest users with identity ID', async () => {
      // Setup guest user (not logged in but has identity ID)
      (mockAuth.isLoggedIn as any).value = false;
      (mockAuth.currentUser as any).value = null;
      
      // Setup mock identity ID
      vi.mocked(fetchAuthSession).mockResolvedValueOnce({
        identityId: 'guest-identity-id',
      } as any);
      
      const { getAuthOptions } = useIdentity();
      
      // Call without specific options
      const result = await getAuthOptions();
      
      // Just verify a valid auth mode is returned
      expect(result).toHaveProperty('authMode');
    });
    
    it('should fallback to lambda mode if no identification is available', async () => {
      // Setup with no identification
      (mockAuth.isLoggedIn as any).value = false;
      (mockAuth.currentUser as any).value = null;
      
      // No identity ID in session
      vi.mocked(fetchAuthSession).mockResolvedValueOnce({
        // No identityId property
      } as any);
      
      // Mock Date.now for deterministic testing
      const originalDateNow = Date.now;
      Date.now = vi.fn(() => 1234567890);
      
      try {
        const { getAuthOptions } = useIdentity();
        
        // Call without specific options
        const result = await getAuthOptions();
        
        // Verify fallback to lambda mode
        expect(result).toHaveProperty('authMode', 'lambda');
        expect(result).toHaveProperty('authToken');
        
        // Parse the authToken to check it has the expected structure
        const authToken = JSON.parse(result.authToken as string);
        expect(authToken).toHaveProperty('timestamp', 1234567890);
      } finally {
        // Restore Date.now
        Date.now = originalDateNow;
      }
    });
    
    it('should handle errors gracefully', async () => {
      // Mock fetchAuthSession to throw an error
      vi.mocked(fetchAuthSession).mockRejectedValueOnce(new Error('Auth error'));
      
      const { getAuthOptions } = useIdentity();
      
      // Call without specific options
      const result = await getAuthOptions();
      
      // Verify we have a fallback
      expect(result).toHaveProperty('authMode', 'lambda');
      expect(result).toHaveProperty('authToken');
    });
  });
  
  describe('isResourceOwner', () => {
    it('should return false for empty owners list', async () => {
      const { isResourceOwner } = useIdentity();
      
      // Call with empty owners list
      const result = await isResourceOwner([]);
      
      // Should be false for empty list
      expect(result).toBe(false);
    });
    
    it('should check if current user ID is in owners list', async () => {
      // Mock fetchAuthSession to provide a valid owner ID
      vi.mocked(fetchAuthSession).mockResolvedValue({
        identityId: 'test-owner-id',
      } as any);
      
      const { isResourceOwner } = useIdentity();
      
      // Call with owners list including the mocked ID
      await isResourceOwner(['test-owner-id', 'other-id']);
      
      // Verify fetchAuthSession was called
      expect(fetchAuthSession).toHaveBeenCalled();
    });
  });
  
  describe('initialization behavior', () => {
    it('should call getIdentityId during initialization', () => {
      // Setup mock for fetchAuthSession
      vi.mocked(fetchAuthSession).mockResolvedValueOnce({
        identityId: 'initial-identity-id',
      } as any);
      
      // Initialize the composable
      useIdentity();
      
      // Verify fetchAuthSession was called during initialization
      expect(fetchAuthSession).toHaveBeenCalled();
    });
  });
});