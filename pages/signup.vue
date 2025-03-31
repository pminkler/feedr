<script setup lang="ts">
import { ref } from 'vue';
import { signUp, confirmSignUp, signInWithRedirect } from 'aws-amplify/auth';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import type { AuthFormField } from '../types/models';

interface FormError<P extends string = string> {
  name?: P;
  message: string;
}

definePageMeta({
  layout: 'landing',
});

const { t } = useI18n({ useScope: 'local' });
const localePath = useLocalePath();
const router = useRouter();

// Loading and error state
const signUpLoading = ref(false);
const confirmLoading = ref(false);
const authError = ref(''); // For submission errors

// We'll switch between the sign-up form and the confirmation form.
const isConfirmStep = ref(false);

// Store sign-up data to use in the confirmation step.
const signUpData = ref<{ email: string; password: string }>({
  email: '',
  password: '',
});

// ---------------------------------------------------------------------
// Fields for the sign-up form (using i18n translations)
const signUpFields: AuthFormField[] = [
  {
    name: 'email',
    type: 'text',
    label: t('signup.email.label'),
    placeholder: t('signup.email.placeholder'),
  },
  {
    name: 'password',
    type: 'password',
    label: t('signup.password.label'),
    placeholder: t('signup.password.placeholder'),
    help: t('signup.password.help'),
  },
  {
    name: 'repeatPassword',
    type: 'password',
    label: t('signup.repeatPassword.label'),
    placeholder: t('signup.repeatPassword.placeholder'),
  },
];

// ---------------------------------------------------------------------
// Fields for the confirmation form.
const confirmationFields: AuthFormField[] = [
  {
    name: 'confirmationCode',
    type: 'text',
    label: t('signup.confirmation.code.label'),
    placeholder: t('signup.confirmation.code.placeholder'),
  },
];

// ---------------------------------------------------------------------
// Yup schema for sign-up form validation (using t for error messages)
const signUpSchema = yup.object({
  email: yup
    .string()
    .email(t('signup.email.errorInvalid'))
    .required(t('signup.email.errorRequired')),
  password: yup
    .string()
    .min(8, t('signup.password.errorMin'))
    .matches(/[A-Z]/, t('signup.password.errorUpper'))
    .matches(/[a-z]/, t('signup.password.errorLower'))
    .matches(/[0-9]/, t('signup.password.errorNumber'))
    .matches(/[@$!%*?&]/, t('signup.password.errorSpecial'))
    .required(t('signup.password.errorRequired')),
  repeatPassword: yup
    .string()
    .oneOf([yup.ref('password')], t('signup.repeatPassword.errorMismatch'))
    .required(t('signup.repeatPassword.errorRequired')),
});

// Our synchronous validate function for sign-up fields.
const validateSignUp = (state: object) => {
  try {
    signUpSchema.validateSync(state, { abortEarly: false });
    return [] as FormError<string>[]; // No errors
  } catch (err) {
    const error = err as yup.ValidationError;
    const errors: FormError<string>[] = [];
    if (error.inner && error.inner.length > 0) {
      error.inner.forEach((validationError: yup.ValidationError) => {
        errors.push({ name: validationError.path || '', message: validationError.message });
      });
    } else if (error.path) {
      errors.push({ name: error.path || '', message: error.message });
    }
    return errors;
  }
};

// Validation for the confirmation form.
const validateConfirmation = (state: object) => {
  const errors: FormError<string>[] = [];
  if (!(state as any).confirmationCode) {
    errors.push({
      name: 'confirmationCode',
      message: t('signup.confirmation.code.errorRequired'),
    });
  }
  return errors;
};

// ---------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------

// Called when the user submits the email/password sign-up form.
async function onSignUpSubmit(payload: { data: any }) {
  authError.value = '';
  signUpLoading.value = true;
  try {
    // With the newest UAuthForm, data comes in a nested format
    const formData = payload.data || payload;

    // Make sure we have the required data
    if (!formData.email || !formData.password) {
      throw new Error('Missing required email or password');
    }

    // Store the data for use during confirmation.
    signUpData.value.email = formData.email;
    signUpData.value.password = formData.password;

    // Call Amplify's signUp API.
    const { nextStep } = await signUp({
      username: formData.email,
      password: formData.password,
      options: {
        userAttributes: {
          email: formData.email,
        },
      },
    });

    console.log('Amplify signUp API called successfully', nextStep);

    // If confirmation is required, show the confirmation form.
    if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
      isConfirmStep.value = true;
    } else if (nextStep.signUpStep === 'DONE') {
      console.log('Sign up complete without confirmation.');
      // Redirect the user or update your UI here.
    }
  } catch (error) {
    console.error('Error during sign up', error);
    const err = error as { message?: string };
    authError.value = err.message || t('signup.authError');
  } finally {
    signUpLoading.value = false;
  }
}

// Called when the user submits the confirmation form.
async function onConfirmSubmit(payload: { data: any }) {
  authError.value = '';
  confirmLoading.value = true;
  try {
    // With the newest UAuthForm, data comes in a nested format
    const formData = payload.data || payload;

    if (!formData.confirmationCode) {
      throw new Error('Confirmation code is required');
    }

    const { nextStep } = await confirmSignUp({
      username: signUpData.value.email,
      confirmationCode: formData.confirmationCode,
    });

    if (nextStep.signUpStep === 'DONE') {
      router.push(localePath('login'));
    }
  } catch (error) {
    console.error('Error during confirmation', error);
    const err = error as { message?: string };
    authError.value = err.message || t('signup.authError');
  } finally {
    confirmLoading.value = false;
  }
}

// Handler for signing up with Google.
function onGoogleSignUp() {
  // Trigger the OAuth redirect flow using Google.
  signUpLoading.value = true;
  signInWithRedirect({ provider: 'Google' });
}
</script>

<template>
  <UContainer class="w-full flex justify-center items-center">
    <UCard class="max-w-sm w-full space-y-4">
      <!-- Show email/password sign-up form if not in confirmation step -->
      <template v-if="!isConfirmStep">
        <UAuthForm
          :fields="signUpFields"
          :validate="validateSignUp"
          :title="t('signup.title')"
          align="top"
          icon="i-heroicons-lock-closed"
          :loading="signUpLoading"
          :submit="{ loading: signUpLoading }"
          :providers="[
            {
              label: t('signup.googleProvider'),
              icon: 'cib:google',
              color: 'secondary',
              onClick: onGoogleSignUp,
              loading: signUpLoading,
            },
          ]"
          @submit="onSignUpSubmit"
        >
          <template #description>
            <i18n-t keypath="signup.description">
              <template #signInLink>
                <ULink :to="localePath('login')" color="primary" inactive-class="text-primary"
                  >{{ t('signup.signIn') }}
                </ULink>
              </template>
            </i18n-t>
            <div v-if="authError" class="mt-4">
              <UAlert
                color="error"
                icon="i-heroicons-information-circle-20-solid"
                :title="t('signup.error')"
              >
                {{ authError }}
              </UAlert>
            </div>
          </template>

          <template #footer>
            <i18n-t keypath="signup.footer">
              <template #termsOfService>
                <ULink :to="localePath('terms')" inactive-class="text-primary"
                  >{{ t('signup.termsOfService') }}
                </ULink>
              </template>
            </i18n-t>
          </template>
        </UAuthForm>
      </template>

      <!-- Show confirmation form when needed -->
      <template v-else>
        <UAuthForm
          :fields="confirmationFields"
          :validate="validateConfirmation"
          :title="t('signup.confirmation.title')"
          align="top"
          icon="i-heroicons-check-circle"
          :loading="confirmLoading"
          :submit="{ loading: confirmLoading }"
          @submit="onConfirmSubmit"
        >
          <template #description>
            {{
              t('signup.confirmation.description', {
                email: signUpData.email,
              })
            }}
            <div v-if="authError" class="mt-4">
              <UAlert
                color="error"
                icon="i-heroicons-information-circle-20-solid"
                :title="t('signup.error')"
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

<i18n lang="json">
{
  "en": {
    "signup": {
      "title": "Sign Up",
      "email": {
        "label": "Email",
        "placeholder": "Enter your email",
        "errorRequired": "Email is required",
        "errorInvalid": "Must be a valid email"
      },
      "password": {
        "label": "Password",
        "placeholder": "Enter your password",
        "help": "Min 8 chars, including uppercase, lowercase, number, and special char",
        "errorRequired": "Password is required",
        "errorMin": "Password must be at least 8 characters",
        "errorUpper": "Password must contain at least one uppercase letter",
        "errorLower": "Password must contain at least one lowercase letter",
        "errorNumber": "Password must contain at least one number",
        "errorSpecial": "Password must contain at least one special character"
      },
      "repeatPassword": {
        "label": "Repeat Password",
        "placeholder": "Repeat your password",
        "errorRequired": "Repeat password is required",
        "errorMismatch": "Passwords must match"
      },
      "confirmation": {
        "title": "Confirm Your Email",
        "code": {
          "label": "Confirmation Code",
          "placeholder": "Enter the code sent to your email",
          "errorRequired": "Confirmation code is required"
        },
        "description": "Please enter the confirmation code sent to {email}."
      },
      "description": "Already have an account? {signInLink}.",
      "footer": "By signing up, you agree to our {termsOfService}.",
      "googleProvider": "Continue with Google",
      "error": "Error",
      "authError": "An error occurred during sign up.",
      "signIn": "Sign in",
      "termsOfService": "Terms of Service"
    }
  },
  "fr": {
    "signup": {
      "title": "Inscription",
      "email": {
        "label": "Email",
        "placeholder": "Entrez votre email",
        "errorRequired": "L'email est requis",
        "errorInvalid": "Doit être un email valide"
      },
      "password": {
        "label": "Mot de passe",
        "placeholder": "Entrez votre mot de passe",
        "help": "Au moins 8 caractères, incluant majuscules, minuscules, chiffre et caractère spécial",
        "errorRequired": "Le mot de passe est requis",
        "errorMin": "Le mot de passe doit comporter au moins 8 caractères",
        "errorUpper": "Le mot de passe doit contenir au moins une lettre majuscule",
        "errorLower": "Le mot de passe doit contenir au moins une lettre minuscule",
        "errorNumber": "Le mot de passe doit contenir au moins un chiffre",
        "errorSpecial": "Le mot de passe doit contenir au moins un caractère spécial"
      },
      "repeatPassword": {
        "label": "Répétez le mot de passe",
        "placeholder": "Répétez votre mot de passe",
        "errorRequired": "La répétition du mot de passe est requise",
        "errorMismatch": "Les mots de passe doivent correspondre"
      },
      "confirmation": {
        "title": "Confirmez votre email",
        "code": {
          "label": "Code de confirmation",
          "placeholder": "Entrez le code envoyé à votre email",
          "errorRequired": "Le code de confirmation est requis"
        },
        "description": "Veuillez entrer le code de confirmation envoyé à {email}."
      },
      "description": "Vous avez déjà un compte ? {signInLink}.",
      "footer": "En vous inscrivant, vous acceptez nos {termsOfService}.",
      "googleProvider": "Continuer avec Google",
      "error": "Erreur",
      "authError": "Une erreur est survenue lors de l'inscription.",
      "signIn": "Se connecter",
      "termsOfService": "Conditions d'utilisation"
    }
  },
  "es": {
    "signup": {
      "title": "Registrarse",
      "email": {
        "label": "Correo electrónico",
        "placeholder": "Introduce tu correo electrónico",
        "errorRequired": "El correo electrónico es obligatorio",
        "errorInvalid": "Debe ser un correo electrónico válido"
      },
      "password": {
        "label": "Contraseña",
        "placeholder": "Introduce tu contraseña",
        "help": "Mínimo 8 caracteres, incluyendo mayúsculas, minúsculas, número y carácter especial",
        "errorRequired": "La contraseña es obligatoria",
        "errorMin": "La contraseña debe tener al menos 8 caracteres",
        "errorUpper": "La contraseña debe contener al menos una letra mayúscula",
        "errorLower": "La contraseña debe contener al menos una letra minúscula",
        "errorNumber": "La contraseña debe contener al menos un número",
        "errorSpecial": "La contraseña debe contener al menos un carácter especial"
      },
      "repeatPassword": {
        "label": "Repite la contraseña",
        "placeholder": "Repite tu contraseña",
        "errorRequired": "Repetir la contraseña es obligatorio",
        "errorMismatch": "Las contraseñas deben coincidir"
      },
      "confirmation": {
        "title": "Confirma tu correo",
        "code": {
          "label": "Código de confirmación",
          "placeholder": "Introduce el código enviado a tu correo",
          "errorRequired": "El código de confirmación es obligatorio"
        },
        "description": "Por favor, introduce el código de confirmación enviado a {email}."
      },
      "description": "¿Ya tienes una cuenta? {signInLink}.",
      "footer": "Al registrarte, aceptas nuestros {termsOfService}.",
      "googleProvider": "Continuar con Google",
      "error": "Error",
      "authError": "Ocurrió un error durante el registro.",
      "signIn": "Iniciar sesión",
      "termsOfService": "Términos de servicio"
    }
  }
}
</i18n>
