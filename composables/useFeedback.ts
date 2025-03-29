import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { useIdentity } from '~/composables/useIdentity';
import { useAuth } from '~/composables/useAuth';

const client = generateClient<Schema>();

export function useFeedback() {
  const { getAuthOptions } = useIdentity();
  const { isLoggedIn } = useAuth();

  async function createFeedback(feedbackData: { email: string; message: string }) {
    try {
      // Get auth options based on user state
      // For both authenticated and guest users, we'll use identityPool auth mode
      // which is the most reliable for public operations
      const authOptions = await getAuthOptions({ authMode: 'identityPool' });

      console.log('Creating feedback with auth options:', authOptions);

      // Create feedback with appropriate auth options
      const { data } = await client.models.Feedback.create(feedbackData, authOptions);
      console.log('Feedback created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  }

  return {
    createFeedback,
  };
}
