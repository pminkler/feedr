<script setup lang="ts">
import { ref } from "vue";
import { signIn, confirmSignIn } from "aws-amplify/auth";
import type { FormError } from "#ui/types";

const localePath = useLocalePath();

definePageMeta({
  layout: "single-page",
});

// Reactive state for loading and error messages.
const loading = ref(false);
const authError = ref("");

// Flag to determine if the challenge (confirmation) form should be shown.
const isChallengeStep = ref(false);
// (Optional) Store the challenge type for debugging or for customizing the UI.
const challengeType = ref("");

// Save the user’s email & password for potential later use.
const signInData = ref<{ email: string; password: string }>({
  email: "",
  password: "",
});

// Fields for the initial sign-in form.
const signInFields = [
  {
    name: "email",
    type: "text",
    label: "Email",
    placeholder: "Enter your email",
  },
  {
    name: "password",
    type: "password",
    label: "Password",
    placeholder: "Enter your password",
  },
];

// Fields for the challenge confirmation form.
const challengeFields = [
  {
    name: "challengeResponse",
    type: "text",
    label: "Confirmation Code",
    placeholder: "Enter the code sent to you",
    color: "gray",
  },
];

// Basic field-level validation.
const validateSignIn = (state: any) => {
  const errors: FormError[] = [];
  if (!state.email)
    errors.push({ path: "email", message: "Email is required" });
  if (!state.password)
    errors.push({ path: "password", message: "Password is required" });
  return errors;
};

const validateChallenge = (state: any) => {
  const errors: FormError[] = [];
  if (!state.challengeResponse)
    errors.push({
      path: "challengeResponse",
      message: "Confirmation code is required",
    });
  return errors;
};

// Called when the sign-in form is submitted.
async function onSignInSubmit(data: any) {
  authError.value = ""; // Clear any previous auth error.
  loading.value = true;

  try {
    // Store email and password for potential later use.
    signInData.value.email = data.email;
    signInData.value.password = data.password;

    // Call Amplify's signIn API.
    const result = await signIn({
      username: data.email,
      password: data.password,
    });

    // If further challenge is required, switch to challenge mode.
    if (result.nextStep && result.nextStep.signInStep !== "DONE") {
      isChallengeStep.value = true;
      challengeType.value = result.nextStep.signInStep;
      console.log("Challenge required:", challengeType.value);
    } else {
      console.log("Sign in successful!", result);
      // You can redirect the user or update the UI accordingly here.
    }
  } catch (error: any) {
    console.error("Error during sign in", error);
    // Check for NotAuthorizedException or any other error, and set the auth error.
    if (error.code === "NotAuthorizedException") {
      authError.value = "Incorrect username or password.";
    } else {
      authError.value = error.message || "An error occurred during sign in.";
    }
  } finally {
    loading.value = false;
  }
}

// Called when the challenge confirmation form is submitted.
async function onChallengeSubmit(data: any) {
  authError.value = ""; // Clear previous auth error.
  loading.value = true;

  try {
    // Call Amplify's confirmSignIn API.
    const result = await confirmSignIn({
      challengeResponse: data.challengeResponse,
    });

    if (result.nextStep && result.nextStep.signInStep !== "DONE") {
      challengeType.value = result.nextStep.signInStep;
      console.log("Additional challenge required:", challengeType.value);
    } else {
      console.log("Sign in complete!", result);
      // Redirect or update the UI to indicate a successful sign in.
    }
  } catch (error: any) {
    console.error("Error confirming sign in", error);
    authError.value = error.message || "An error occurred during confirmation.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UContainer class="w-full flex justify-center items-center">
    <UCard class="max-w-sm w-full space-y-4">
      <!-- Render sign-in form if no challenge is required -->
      <div v-if="!isChallengeStep">
        <UAuthForm
          title="Sign In"
          description="Enter your credentials to access your account."
          align="top"
          icon="i-heroicons-lock-closed"
          :fields="signInFields"
          :validate="validateSignIn"
          :loading="loading"
          :providers="[
            { label: 'Google', icon: 'i-simple-icons-google', color: 'gray' },
          ]"
          @submit="onSignInSubmit"
        >
          <template #description>
            Don't have an account?
            <NuxtLink
              :to="localePath('/signup')"
              class="text-primary font-medium"
              >Sign up</NuxtLink
            >.

            <!-- Dedicated area for auth errors -->
            <div v-if="authError" class="mt-4">
              <UAlert
                color="red"
                icon="i-heroicons-information-circle-20-solid"
                title="Authentication Error"
              >
                {{ authError }}
              </UAlert>
            </div>
          </template>
          <template #footer>
            By signing in, you agree to our
            <NuxtLink
              :to="localePath('/terms')"
              class="text-primary font-medium"
              >Terms of Service</NuxtLink
            >.
          </template>
        </UAuthForm>
      </div>

      <!-- Render challenge confirmation form if required -->
      <div v-else>
        <UAuthForm
          title="Enter Confirmation Code"
          description="A confirmation code has been sent to your email or phone. Please enter it below to complete sign in."
          align="top"
          icon="i-heroicons-check-circle"
          :fields="challengeFields"
          :validate="validateChallenge"
          :loading="loading"
          @submit="onChallengeSubmit"
        >
          <template #description>
            Please enter the confirmation code sent to
            <strong>{{ signInData.email }}</strong
            >.
          </template>
        </UAuthForm>
      </div>
    </UCard>
  </UContainer>
</template>
