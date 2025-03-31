import { describe, it, expect, vi, beforeEach } from 'vitest';

// Import after mocks are set up
import { useFeedback } from '~/composables/useFeedback';

// Mock dependencies
vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({
    models: {
      Feedback: {
        create: vi.fn().mockResolvedValue({ data: { id: 'mock-feedback-id' } }),
      },
    },
  }),
}));

vi.mock('~/composables/useIdentity', () => ({
  useIdentity: () => ({
    getAuthOptions: vi.fn().mockResolvedValue({ authMode: 'identityPool' }),
  }),
}));

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    isLoggedIn: { value: false },
  }),
}));

describe('useFeedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
