import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { useIdentity } from './useIdentity';

const client = generateClient<Schema>();

// Define feedback type options for type safety and reuse
export type FeedbackType =
  | 'FEATURE_REQUEST'
  | 'BUG_REPORT'
  | 'GENERAL_FEEDBACK'
  | 'QUESTION'
  | 'SUGGESTION'
  | 'OTHER';

// Interface for feedback data
export interface FeedbackData {
  email: string;
  message: string;
  type: FeedbackType;
}

export function useFeedback() {
  const { getAuthOptions } = useIdentity();

  // Get available feedback types for UI display
  const feedbackTypes = [
    { value: 'FEATURE_REQUEST', label: 'Feature Request' },
    { value: 'BUG_REPORT', label: 'Bug Report' },
    { value: 'GENERAL_FEEDBACK', label: 'General Feedback' },
    { value: 'QUESTION', label: 'Question' },
    { value: 'SUGGESTION', label: 'Suggestion' },
    { value: 'OTHER', label: 'Other' },
  ];

  async function createFeedback(feedbackData: FeedbackData) {
    try {
      // Get auth options based on user state
      // For both authenticated and guest users, we'll use identityPool auth mode
      // which is the most reliable for public operations
      const authOptions = await getAuthOptions();

      console.log('Creating feedback with auth options:', authOptions);

      // Create feedback with appropriate auth options using null assertion
      // We check if client.models.Feedback exists before proceeding
      if (client?.models?.Feedback) {
        const { data } = await client.models.Feedback.create(feedbackData, authOptions);
        console.log('Feedback created successfully:', data);
        return data;
      } else {
        throw new Error('Feedback model not available');
      }
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  }

  return {
    createFeedback,
    feedbackTypes,
  };
}
