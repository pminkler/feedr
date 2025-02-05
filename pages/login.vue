<script setup lang="ts">
import { ref } from "vue";
import { signUp, confirmSignUp } from "aws-amplify/auth";
import type { FormError } from "#ui/types";

definePageMeta({
  layout: "single-page",
});

// We'll switch between the sign-up form and the confirmation form.
const isConfirmStep = ref(false);

// Store sign-up data to use in the confirmation step.
const signUpData = ref<{ email: string; password: string }>({
  email: "",
  password: "",
});

// Fields for the sign-up form.
const signUpFields = [
  {
    name: "email",
    type: "text",
    label: "Email",
    placeholder: "Enter your email",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
  },
];

// Fields for the confirmation form.
const confirmationFields = [
  {
    name: "confirmationCode",
    type: "text",
    label: "Confirmation Code",
    placeholder: "Enter the code sent to your email",
  },
];

// Validate the sign-up form.
const validateSignUp = (state: any) => {
  const errors: FormError[] = [];
  if (!state.email)
    errors.push({ path: "email", message: "Email is required" });
  if (!state.password)
    errors.push({ path: "password", message: "Password is required" });
  return errors;
};

// Validate the confirmation form.
const validateConfirmation = (state: any) => {
  const errors: FormError[] = [];
  if (!state.confirmationCode)
    errors.push({
      path: "confirmationCode",
      message: "Confirmation code is required",
    });
  return errors;
};

// Called when the user submits the sign-up form.
async function onSignUpSubmit(data: any) {
  try {
    // Store the data for use during confirmation.
    signUpData.value.email = data.email;
    signUpData.value.password = data.password;

    // Call Amplify's signUp API.
    const { nextStep } = await signUp({
      username: data.email,
      password: data.password,
      options: {
        userAttributes: {
          email: data.email,
        },
      },
    });

    // If confirmation is required, show the confirmation form.
    if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
      isConfirmStep.value = true;
    } else if (nextStep.signUpStep === "DONE") {
      console.log("Sign up complete without confirmation.");
      // You can redirect the user or update your UI here.
    }
  } catch (error) {
    console.error("Error during sign up", error);
    // Optionally, display an error alert in the UI.
  }
}

// Called when the user submits the confirmation form.
async function onConfirmSubmit(data: any) {
  try {
    const { nextStep } = await confirmSignUp({
      username: signUpData.value.email,
      confirmationCode: data.confirmationCode,
    });

    if (nextStep.signUpStep === "DONE") {
      console.log("Sign up confirmed and complete.");
      // You can now redirect the user or show a success message.
    }
  } catch (error) {
    console.error("Error during confirmation", error);
    // Optionally, display an error alert in the UI.
  }
}
</script>

<template>
  <UContainer class="w-full flex justify-center items-center">
    <UCard class="max-w-sm w-full">
      <!-- Show sign-up form if not in confirmation step -->
      <template v-if="!isConfirmStep">
        <UAuthForm
          :fields="signUpFields"
          :validate="validateSignUp"
          title="Sign Up"
          align="top"
          icon="i-heroicons-lock-closed"
          @submit="onSignUpSubmit"
        >
          <template #description>
            Already have an account?
            <NuxtLink to="/login" class="text-primary font-medium"
              >Sign in</NuxtLink
            >.
          </template>
          <template #footer>
            By signing up, you agree to our
            <NuxtLink to="/" class="text-primary font-medium"
              >Terms of Service</NuxtLink
            >.
          </template>
        </UAuthForm>
      </template>

      <!-- Show confirmation form when needed -->
      <template v-else>
        <UAuthForm
          :fields="confirmationFields"
          :validate="validateConfirmation"
          title="Confirm Your Email"
          align="top"
          icon="i-heroicons-check-circle"
          @submit="onConfirmSubmit"
        >
          <template #description>
            Please enter the confirmation code sent to
            <strong>{{ signUpData.email }}</strong
            >.
          </template>
        </UAuthForm>
      </template>
    </UCard>
  </UContainer>
</template>
