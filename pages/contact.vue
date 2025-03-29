<script setup lang="ts">
import { object, string, type InferType } from 'yup';
import { reactive, ref } from 'vue';
import { useFeedback } from '~/composables/useFeedback';
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'local' });

const { createFeedback } = useFeedback();
const loading = ref(false);
const toast = useToast();

// Build the Yup validation schema using translations
const schema = object({
  email: string()
    .email(t('contact.validation.email.invalid'))
    .required(t('contact.validation.email.required')),
  message: string()
    .min(10, t('contact.validation.message.min'))
    .required(t('contact.validation.message.required')),
});

type Schema = InferType<typeof schema>;

const state = reactive({
  email: '',
  message: '',
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true;
  try {
    await createFeedback({
      email: state.email,
      message: state.message,
    });

    state.email = '';
    state.message = '';
    toast.add({
      id: 'feedback_success',
      title: t('contact.toast.success.title'),
      description: t('contact.toast.success.description'),
      icon: 'i-octicon-check-circle-24',
      duration: 5000,
    });
  } catch (error) {
    console.error(error);
    toast.add({
      id: 'feedback_failure',
      title: t('contact.toast.failure.title'),
      description: t('contact.toast.failure.description'),
      icon: 'i-octicon-alert-24',
      duration: 5000,
      color: 'red',
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UContainer class="w-full md:w-3/4 lg:w-1/2 py-8">
    <h1 class="text-2xl font-bold mb-6">{{ t('contact.title') }}</h1>

    <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
      <UFormGroup name="email" :label="t('contact.form.labels.email')" required>
        <UFormItem>
          <UInput
            v-model="state.email"
            name="email"
            type="email"
            :placeholder="t('contact.form.placeholders.email')"
            icon="i-heroicons-envelope"
            autocomplete="email"
          />
        </UFormItem>
      </UFormGroup>

      <UFormGroup name="message" :label="t('contact.form.labels.message')" required>
        <UFormItem>
          <UTextarea
            v-model="state.message"
            name="message"
            :placeholder="t('contact.form.placeholders.message')"
            :rows="6"
            autoresize
          />
        </UFormItem>
      </UFormGroup>

      <div class="flex justify-end">
        <UButton
          type="submit"
          :loading="loading"
          :disabled="loading"
          color="primary"
          icon="i-heroicons-paper-airplane"
        >
          {{ t('contact.form.button') }}
        </UButton>
      </div>
    </UForm>
  </UContainer>
</template>

<i18n lang="json">
{
  "en": {
    "contact": {
      "title": "Contact Us",
      "form": {
        "labels": {
          "email": "Email Address",
          "message": "Your Message"
        },
        "placeholders": {
          "email": "Enter your email address",
          "message": "How can we help you?"
        },
        "button": "Send Message"
      },
      "validation": {
        "email": {
          "required": "Email address is required",
          "invalid": "Please enter a valid email address"
        },
        "message": {
          "required": "Message is required",
          "min": "Message must be at least 10 characters"
        }
      },
      "toast": {
        "success": {
          "title": "Message Sent",
          "description": "Thank you for your message. We'll get back to you soon."
        },
        "failure": {
          "title": "Error",
          "description": "Failed to send message. Please try again later."
        }
      }
    }
  },
  "fr": {
    "contact": {
      "title": "Contactez-nous",
      "form": {
        "labels": {
          "email": "Adresse email",
          "message": "Votre message"
        },
        "placeholders": {
          "email": "Entrez votre adresse email",
          "message": "Comment pouvons-nous vous aider ?"
        },
        "button": "Envoyer le message"
      },
      "validation": {
        "email": {
          "required": "L'adresse email est requise",
          "invalid": "Veuillez entrer une adresse email valide"
        },
        "message": {
          "required": "Le message est requis",
          "min": "Le message doit comporter au moins 10 caractères"
        }
      },
      "toast": {
        "success": {
          "title": "Message envoyé",
          "description": "Merci pour votre message. Nous vous répondrons bientôt."
        },
        "failure": {
          "title": "Erreur",
          "description": "Échec de l'envoi du message. Veuillez réessayer plus tard."
        }
      }
    }
  },
  "es": {
    "contact": {
      "title": "Contáctenos",
      "form": {
        "labels": {
          "email": "Correo electrónico",
          "message": "Su mensaje"
        },
        "placeholders": {
          "email": "Ingrese su correo electrónico",
          "message": "¿Cómo podemos ayudarle?"
        },
        "button": "Enviar mensaje"
      },
      "validation": {
        "email": {
          "required": "El correo electrónico es obligatorio",
          "invalid": "Por favor, introduzca un correo electrónico válido"
        },
        "message": {
          "required": "El mensaje es obligatorio",
          "min": "El mensaje debe tener al menos 10 caracteres"
        }
      },
      "toast": {
        "success": {
          "title": "Mensaje enviado",
          "description": "Gracias por su mensaje. Le responderemos pronto."
        },
        "failure": {
          "title": "Error",
          "description": "No se pudo enviar el mensaje. Por favor, inténtelo de nuevo más tarde."
        }
      }
    }
  }
}
</i18n>
