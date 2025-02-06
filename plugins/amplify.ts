import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { useAuth } from "~/composables/useAuth";

export default defineNuxtPlugin(async (nuxtApp) => {
  Amplify.configure(outputs);

  const { fetchUser } = useAuth();
  await fetchUser();
});
