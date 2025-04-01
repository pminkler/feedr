import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Save original console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Create reusable mock factories for different scenarios
function createSuccessfulClient() {
  return {
    generateClient: vi.fn().mockReturnValue({
      models: {
        Feedback: {
          create: vi.fn().mockResolvedValue({ data: { id: 'mock-id' } })
        }
      }
    })
  };
}

function createMissingModelClient() {
  return {
    generateClient: vi.fn().mockReturnValue({
      models: {}
    })
  };
}

function createErrorClient() {
  return {
    generateClient: vi.fn().mockReturnValue({
      models: {
        Feedback: {
          create: vi.fn().mockRejectedValue(new Error('API error'))
        }
      }
    })
  };
}

// Mock useIdentity consistently across all tests
vi.mock('~/composables/useIdentity', () => ({
  useIdentity: () => ({
    getAuthOptions: vi.fn().mockResolvedValue({ authMode: 'identityPool' })
  })
}));

describe('useFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock console methods
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    
    // Reset modules between tests
    vi.resetModules();
  });

  // Test 1: Mock the happy path
  describe('with available Feedback model', () => {
    beforeEach(() => {
      // Setup the success mock
      vi.doMock('aws-amplify/data', createSuccessfulClient);
    });
    
    it('exports feedbackTypes with correct structure', async () => {
      // Import after mocks are setup
      const { useFeedback } = await import('~/composables/useFeedback');
      const { feedbackTypes } = useFeedback();

      // Verify feedback types structure
      expect(Array.isArray(feedbackTypes)).toBe(true);
      expect(feedbackTypes).toHaveLength(6);
      expect(feedbackTypes[0]).toHaveProperty('value');
      expect(feedbackTypes[0]).toHaveProperty('label');

      // Verify all supported feedback types are included
      const types = feedbackTypes.map((t) => t.value);
      expect(types).toContain('FEATURE_REQUEST');
      expect(types).toContain('BUG_REPORT');
      expect(types).toContain('GENERAL_FEEDBACK');
      expect(types).toContain('QUESTION');
      expect(types).toContain('SUGGESTION');
      expect(types).toContain('OTHER');
    });
    
    it('provides a createFeedback function', async () => {
      // Import after mocks are setup
      const { useFeedback } = await import('~/composables/useFeedback');
      const { createFeedback } = useFeedback();
      expect(typeof createFeedback).toBe('function');
    });

    // Test for successful feedback creation
    it('successfully creates feedback', async () => {
      // Import after mocks are setup
      const { useFeedback } = await import('~/composables/useFeedback');
      const { createFeedback } = useFeedback();
      
      const feedbackData = {
        email: 'test@example.com',
        message: 'Test message',
        type: 'FEATURE_REQUEST'
      };
      
      const result = await createFeedback(feedbackData);
      
      // Verify result
      expect(result).toEqual({ id: 'mock-id' });
      
      // Verify logs - using any() because the exact object structure is uncertain
      expect(console.log).toHaveBeenCalledWith('Creating feedback with auth options:', expect.any(Object));
      expect(console.log).toHaveBeenCalledWith('Feedback created successfully:', expect.any(Object));
    });
  });
  
  // Test 2: Mock missing Feedback model
  describe('with missing Feedback model', () => {
    beforeEach(() => {
      // Setup the missing model mock
      vi.doMock('aws-amplify/data', createMissingModelClient);
    });
    
    it('throws error when Feedback model is not available', async () => {
      // Import after mocks are setup
      const { useFeedback } = await import('~/composables/useFeedback');
      const { createFeedback } = useFeedback();
      
      const feedbackData = {
        email: 'test@example.com',
        message: 'Test message',
        type: 'FEATURE_REQUEST'
      };
      
      await expect(createFeedback(feedbackData)).rejects.toThrow('Feedback model not available');
      expect(console.error).toHaveBeenCalledWith('Error creating feedback:', expect.any(Error));
    });
  });
  
  // Test 3: Mock create function throwing error
  describe('with Feedback.create throwing error', () => {
    beforeEach(() => {
      // Setup the error mock
      vi.doMock('aws-amplify/data', createErrorClient);
    });
    
    it('throws error when Feedback.create fails', async () => {
      // Import after mocks are setup
      const { useFeedback } = await import('~/composables/useFeedback');
      const { createFeedback } = useFeedback();
      
      const feedbackData = {
        email: 'test@example.com',
        message: 'Test message',
        type: 'FEATURE_REQUEST'
      };
      
      await expect(createFeedback(feedbackData)).rejects.toThrow('API error');
      expect(console.error).toHaveBeenCalledWith('Error creating feedback:', expect.any(Error));
    });
  });
});