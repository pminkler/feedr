import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Save original console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Mock AWS Amplify data explicitly
vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({
    models: {
      Feedback: {
        create: vi.fn().mockResolvedValue({ data: { id: 'mock-id' } })
      }
    }
  })
}));

// Mock useIdentity
vi.mock('~/composables/useIdentity', () => ({
  useIdentity: () => ({
    getAuthOptions: vi.fn().mockResolvedValue({ authMode: 'identityPool' })
  })
}));

// Import after mocks are setup
import { useFeedback } from '~/composables/useFeedback';

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
  });

  it('exports feedbackTypes with correct structure', () => {
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
  
  it('provides a createFeedback function', () => {
    const { createFeedback } = useFeedback();
    expect(typeof createFeedback).toBe('function');
  });

  // Test for successful feedback creation
  it('successfully creates feedback', async () => {
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