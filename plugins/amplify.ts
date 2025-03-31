import { Amplify } from 'aws-amplify';
import { parseAmplifyConfig } from 'aws-amplify/utils';
import outputs from '@/amplify_outputs.json';
import { useAuth } from '~/composables/useAuth';

export default defineNuxtPlugin(async () => {
  const amplifyConfig = parseAmplifyConfig(outputs);

  Amplify.configure({
    ...amplifyConfig,
    API: {
      ...amplifyConfig.API,
      REST: outputs.custom.API,
    },
  });

  const { fetchUser } = useAuth();
  await fetchUser();
});
