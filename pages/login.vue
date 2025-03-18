<script setup lang="ts">
import { ref } from "vue";
import { signIn, confirmSignIn, signInWithRedirect } from "aws-amplify/auth";
import type { FormError } from "#ui/types";
import { definePageMeta, useLocalePath, useRouter } from "#imports";
import { useI18n } from "vue-i18n";

definePageMeta({
  layout: "landing",
});

const { t } = useI18n({ useScope: "local" });
const localePath = useLocalePath();
const router = useRouter();

// Reactive state for loading and error messages.
const loading = ref(false);
const authError = ref("");

// Flag to determine if the challenge (confirmation) form should be shown.
const isChallengeStep = ref(false);
const challengeType = ref("");

// Save the user’s email & password for potential later use.
const signInData = ref<{ email: string; password: string }>({
  email: "",
  password: "",
});

// ---------------------------------------------------------------------
// Fields for the initial sign-in form.
const signInFields = [
  {
    name: "email",
    type: "text",
    label: t("login.email.label"),
    placeholder: t("login.email.placeholder"),
  },
  {
    name: "password",
    type: "password",
    label: t("login.password.label"),
    placeholder: t("login.password.placeholder"),
  },
];

// ---------------------------------------------------------------------
// Fields for the challenge confirmation form.
const challengeFields = [
  {
    name: "challengeResponse",
    type: "text",
    label: t("login.challenge.label"),
    placeholder: t("login.challenge.placeholder"),
    color: "neutral",
  },
];

// Basic field-level validation.
const validateSignIn = (state: any) => {
  const errors: FormError[] = [];
  if (!state.email)
    errors.push({ path: "email", message: t("login.email.errorRequired") });
  if (!state.password)
    errors.push({
      path: "password",
      message: t("login.password.errorRequired"),
    });
  return errors;
};

const validateChallenge = (state: any) => {
  const errors: FormError[] = [];
  if (!state.challengeResponse)
    errors.push({
      path: "challengeResponse",
      message: t("login.challenge.errorRequired"),
    });
  return errors;
};

// ---------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------

// Called when the user submits the email/password sign-in form.
async function onSignInSubmit(data: any) {
  authError.value = "";
  loading.value = true;
  console.log("Form data received:", data);

  // With the newest UAuthForm, data comes in a nested format
  const formData = data.data || data;

  try {
    // Make sure we have the form data values
    if (!formData.email) {
      throw new Error("Email is required");
    }

    // Store email and password for potential later use.
    signInData.value.email = formData.email;
    signInData.value.password = formData.password;

    // Call Amplify's signIn API.
    const result = await signIn({
      username: formData.email,
      password: formData.password,
    });

    // If further challenge is required, switch to challenge mode.
    if (result.nextStep && result.nextStep.signInStep !== "DONE") {
      isChallengeStep.value = true;
      challengeType.value = result.nextStep.signInStep;
      console.log("Challenge required:", challengeType.value);
    } else {
      console.log("Sign in successful!", result);
      // Redirect to /home page upon successful sign in.
      router.push(localePath("/bookmarks"));
    }
  } catch (error: any) {
    console.error("Error during sign in", error);
    if (error.code === "NotAuthorizedException") {
      authError.value = t("login.authErrorIncorrect");
    } else {
      authError.value = error.message || t("login.authError");
    }
  } finally {
    loading.value = false;
  }
}

// Called when the challenge confirmation form is submitted.
async function onChallengeSubmit(data: any) {
  authError.value = "";
  loading.value = true;
  console.log("Challenge data received:", data);

  // With the newest UAuthForm, data comes in a nested format
  const formData = data.data || data;

  try {
    const result = await confirmSignIn({
      challengeResponse: formData.challengeResponse,
    });

    if (result.nextStep && result.nextStep.signInStep !== "DONE") {
      challengeType.value = result.nextStep.signInStep;
      console.log("Additional challenge required:", challengeType.value);
    } else {
      console.log("Sign in complete!", result);
      router.push(localePath("/bookmarks"));
    }
  } catch (error: any) {
    console.error("Error confirming sign in", error);
    authError.value = error.message || t("login.authError");
  } finally {
    loading.value = false;
  }
}

// Handler for signing in with Google.
function onGoogleSignIn() {
  signInWithRedirect({ provider: "Google" });
}
</script>

<template>
  <UContainer class="w-full flex justify-center items-center">
    <UCard class="max-w-sm w-full space-y-4">
      <!-- Render sign-in form if no challenge is required -->
      <div v-if="!isChallengeStep">
        <UAuthForm
          :title="t('login.title')"
          align="top"
          icon="i-heroicons-lock-closed"
          :fields="signInFields"
          :validate="validateSignIn"
          :loading="loading"
          :providers="[
            {
              label: t('login.googleProvider'),
              icon: 'i-simple-icons-google',
              color: 'secondary',
              onClick: onGoogleSignIn,
            },
          ]"
          @submit="onSignInSubmit"
        >
          <template #description>
            <i18n-t keypath="login.description">
              <template #signUpLink>
                <ULink
                  inactive-class="text-primary"
                  :to="localePath('signup')"
                  >{{ t("login.signUp") }}</ULink
                >
              </template>
            </i18n-t>
            <div v-if="authError" class="mt-4">
              <UAlert
                color="red"
                icon="i-heroicons-information-circle-20-solid"
                :title="t('login.errorTitle')"
              >
                {{ authError }}
              </UAlert>
            </div>
          </template>
          <template #footer>
            <i18n-t keypath="login.footer">
              <template #termsOfService>
                <ULink
                  inactive-class="text-primary"
                  :to="localePath('terms')"
                  >{{ t("login.termsOfService") }}</ULink
                >
              </template>
            </i18n-t>
          </template>
        </UAuthForm>
      </div>

      <!-- Render challenge confirmation form if required -->
      <div v-else>
        <UAuthForm
          :title="t('login.challenge.title')"
          :description="
            t('login.challenge.description', { email: signInData.email })
          "
          align="top"
          icon="i-heroicons-check-circle"
          :fields="challengeFields"
          :validate="validateChallenge"
          :loading="loading"
          @submit="onChallengeSubmit"
        >
          <template #description>
            {{
              t("login.challenge.description", {
                email: signInData.email,
              })
            }}
            <div v-if="authError" class="mt-4">
              <UAlert
                color="red"
                icon="i-heroicons-information-circle-20-solid"
                :title="t('login.errorTitle')"
              >
                {{ authError }}
              </UAlert>
            </div>
          </template>
        </UAuthForm>
      </div>
    </UCard>
  </UContainer>
</template>

<i18n lang="json">
{
  "en": {
    "login": {
      "title": "Sign In",
      "description": "Enter your credentials to access your account. Don't have an account? {signUpLink}.",
      "email": {
        "label": "Email",
        "placeholder": "Enter your email",
        "errorRequired": "Email is required"
      },
      "password": {
        "label": "Password",
        "placeholder": "Enter your password",
        "errorRequired": "Password is required"
      },
      "googleProvider": "Continue with Google",
      "challenge": {
        "title": "Enter Confirmation Code",
        "description": "A confirmation code has been sent to {email}. Please enter it below to complete sign in.",
        "label": "Confirmation Code",
        "placeholder": "Enter the code sent to you",
        "errorRequired": "Confirmation code is required"
      },
      "signUp": "Sign up",
      "footer": "By signing in, you agree to our {termsOfService}.",
      "termsOfService": "Terms of Service",
      "errorTitle": "Authentication Error",
      "authError": "An error occurred during sign in.",
      "authErrorIncorrect": "Incorrect username or password."
    }
  },
  "fr": {
    "login": {
      "title": "Se connecter",
      "description": "Entrez vos identifiants pour accéder à votre compte. Vous n'avez pas de compte ? {signUpLink}.",
      "email": {
        "label": "Email",
        "placeholder": "Entrez votre email",
        "errorRequired": "L'email est requis"
      },
      "password": {
        "label": "Mot de passe",
        "placeholder": "Entrez votre mot de passe",
        "errorRequired": "Le mot de passe est requis"
      },
      "googleProvider": "Continuer avec Google",
      "challenge": {
        "title": "Entrez le code de confirmation",
        "description": "Un code de confirmation a été envoyé à {email}. Veuillez l'entrer ci-dessous pour terminer la connexion.",
        "label": "Code de confirmation",
        "placeholder": "Entrez le code qui vous a été envoyé",
        "errorRequired": "Le code de confirmation est requis"
      },
      "signUp": "S'inscrire",
      "footer": "En vous connectant, vous acceptez nos {termsOfService}.",
      "termsOfService": "Conditions d'utilisation",
      "errorTitle": "Erreur d'authentification",
      "authError": "Une erreur est survenue lors de la connexion.",
      "authErrorIncorrect": "Nom d'utilisateur ou mot de passe incorrect."
    }
  },
  "es": {
    "login": {
      "title": "Iniciar sesión",
      "description": "Introduce tus credenciales para acceder a tu cuenta. ¿No tienes una cuenta? {signUpLink}.",
      "email": {
        "label": "Correo electrónico",
        "placeholder": "Introduce tu correo electrónico",
        "errorRequired": "El correo electrónico es obligatorio"
      },
      "password": {
        "label": "Contraseña",
        "placeholder": "Introduce tu contraseña",
        "errorRequired": "La contraseña es obligatoria"
      },
      "googleProvider": "Continuar con Google",
      "challenge": {
        "title": "Introduce el código de confirmación",
        "description": "Se ha enviado un código de confirmación a {email}. Por favor, introdúcelo para completar el inicio de sesión.",
        "label": "Código de confirmación",
        "placeholder": "Introduce el código enviado",
        "errorRequired": "El código de confirmación es obligatorio"
      },
      "signUp": "Registrarse",
      "footer": "Al iniciar sesión, aceptas nuestros {termsOfService}.",
      "termsOfService": "Términos de servicio",
      "errorTitle": "Error de autenticación",
      "authError": "Ocurrió un error durante el inicio de sesión.",
      "authErrorIncorrect": "Nombre de usuario o contraseña incorrectos."
    }
  }
}
</i18n>
