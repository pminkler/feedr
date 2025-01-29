import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";

export default defineNuxtPlugin(nuxtApp => {
    Amplify.configure(outputs);
})