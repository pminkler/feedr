import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

export function useFeedback() {
  async function createFeedback(feedbackData: {
    email: string;
    message: string;
  }) {
    const { data } = await client.models.Feedback.create(feedbackData);
  }

  return {
    createFeedback,
  };
}
