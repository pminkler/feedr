import { Amplify } from 'aws-amplify';
import { parseAmplifyConfig } from 'aws-amplify/utils';
import outputs from '@/amplify_outputs.json';
import { useAuth } from '~/composables/useAuth';

export default defineNuxtPlugin(async () => {
  // Using any for now since API typing is complex
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const amplifyConfig = parseAmplifyConfig(outputs as any);

  // Type casting to handle the REST API configuration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customAPI = outputs.custom.API as any;

  Amplify.configure({
    ...amplifyConfig,
    API: {
      ...amplifyConfig.API,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      REST: customAPI as any,
    },
  });

  const { fetchUser } = useAuth();
  await fetchUser();
});
