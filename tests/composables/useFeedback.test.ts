import { describe, it, expect, vi } from 'vitest';

// Define simple mocks for dependencies
vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({ models: {} })
}));

vi.mock('~/composables/useIdentity', () => ({
  useIdentity: () => ({
    getAuthOptions: vi.fn()
  })
}));

// Import after mocks are set up
import { useFeedback } from '~/composables/useFeedback';

describe('useFeedback', () => {
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
