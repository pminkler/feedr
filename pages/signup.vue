<script setup lang="ts">
import { ref } from "vue";
import { signUp, confirmSignUp } from "aws-amplify/auth";
import * as yup from "yup";
import type { FormError } from "#ui/types";
const localePath = useLocalePath();

definePageMeta({
  layout: "single-page",
});

// Loading and error state
const signUpLoading = ref(false);
const confirmLoading = ref(false);
const authError = ref(""); // For submission errors

// We'll switch between the sign-up form and the confirmation form.
const isConfirmStep = ref(false);

// Store sign-up data to use in the confirmation step.
const signUpData = ref<{ email: string; password: string }>({
  email: "",
  password: "",
});

// ---------------------------------------------------------------------
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
    type: "password",
    label: "Password",
    placeholder: "Enter your password",
    help: "Min 8 chars, including uppercase, lowercase, number, and special char",
  },
  {
    name: "repeatPassword",
    type: "password",
    label: "Repeat Password",
    placeholder: "Repeat your password",
  },
];

// ---------------------------------------------------------------------
// Fields for the confirmation form.
const confirmationFields = [
  {
    name: "confirmationCode",
    type: "text",
    label: "Confirmation Code",
    placeholder: "Enter the code sent to your email",
  },
];

// ---------------------------------------------------------------------
// Yup schema for sign-up form validation
// ---------------------------------------------------------------------
const signUpSchema = yup.object({
  email: yup
    .string()
    .email("Must be a valid email")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
    .matches(/[0-9]/, "Password must contain at least one number")
    .matches(
      /[@$!%*?&]/,
      "Password must contain at least one special character",
    )
    .required("Password is required"),
  repeatPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must match")
    .required("Repeat password is required"),
});

// Our synchronous validate function for sign-up fields.
// We convert yup errors into an array of FormError objects.
const validateSignUp = (state: any) => {
  try {
    signUpSchema.validateSync(state, { abortEarly: false });
    return []; // No errors
  } catch (err: any) {
    const errors: FormError[] = [];
    if (err.inner && err.inner.length > 0) {
      err.inner.forEach((error: any) => {
        errors.push({ path: error.path, message: error.message });
      });
    } else if (err.path) {
      errors.push({ path: err.path, message: err.message });
    }
    return errors;
  }
};

// Validation for the confirmation form.
const validateConfirmation = (state: any) => {
  const errors: FormError[] = [];
  if (!state.confirmationCode) {
    errors.push({
      path: "confirmationCode",
      message: "Confirmation code is required",
    });
  }
  return errors;
};

// ---------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------

// Called when the user submits the sign-up form.
async function onSignUpSubmit(data: any) {
  authError.value = "";
  signUpLoading.value = true;
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
  } catch (error: any) {
    console.error("Error during sign up", error);
    authError.value = error.message || "An error occurred during sign up.";
  } finally {
    signUpLoading.value = false;
  }
}

// Called when the user submits the confirmation form.
async function onConfirmSubmit(data: any) {
  authError.value = "";
  confirmLoading.value = true;
  try {
    const { nextStep } = await confirmSignUp({
      username: signUpData.value.email,
      confirmationCode: data.confirmationCode,
    });

    if (nextStep.signUpStep === "DONE") {
      console.log("Sign up confirmed and complete.");
      // You can now redirect the user or show a success message.
    }
  } catch (error: any) {
    console.error("Error during confirmation", error);
    authError.value = error.message || "An error occurred during confirmation.";
  } finally {
    confirmLoading.value = false;
  }
}
</script>

<template>
  <UContainer class="w-full flex justify-center items-center">
    <UCard class="max-w-sm w-full space-y-4">
      <!-- Show sign-up form if not in confirmation step -->
      <template v-if="!isConfirmStep">
        <UAuthForm
          :fields="signUpFields"
          :validate="validateSignUp"
          title="Sign Up"
          align="top"
          icon="i-heroicons-lock-closed"
          :loading="signUpLoading"
          @submit="onSignUpSubmit"
        >
          <template #description>
            Already have an account?
            <NuxtLink
              :to="localePath('/login')"
              class="text-primary font-medium"
            >
              Sign in </NuxtLink
            >.
            <!-- Dedicated area for authentication errors -->
            <div v-if="authError" class="mt-4">
              <UAlert
                color="red"
                icon="i-heroicons-information-circle-20-solid"
                title="Error"
              >
                {{ authError }}
              </UAlert>
            </div>
          </template>
          <template #footer>
            By signing up, you agree to our
            <NuxtLink :to="localePath('/')" class="text-primary font-medium">
              Terms of Service </NuxtLink
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
          :loading="confirmLoading"
          @submit="onConfirmSubmit"
        >
          <template #description>
            Please enter the confirmation code sent to
            <strong>{{ signUpData.email }}</strong
            >.
            <div v-if="authError" class="mt-4">
              <UAlert
                color="red"
                icon="i-heroicons-information-circle-20-solid"
                title="Error"
              >
                {{ authError }}
              </UAlert>
            </div>
          </template>
        </UAuthForm>
      </template>
    </UCard>
  </UContainer>
</template>
