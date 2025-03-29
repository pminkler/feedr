<script setup lang="ts">
import { object, string, type InferType } from 'yup';
import { reactive, ref } from 'vue';
import { useFeedback, type FeedbackType } from '~/composables/useFeedback';
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'local' });

const { createFeedback, feedbackTypes } = useFeedback();
const loading = ref(false);
const toast = useToast();

// Build the Yup validation schema using translations
const schema = object({
  email: string()
    .email(t('contact.validation.email.invalid'))
    .required(t('contact.validation.email.required')),
  type: string().required(t('contact.validation.type.required')),
  message: string()
    .min(10, t('contact.validation.message.min'))
    .required(t('contact.validation.message.required')),
});

type Schema = InferType<typeof schema>;

const state = reactive({
  email: '',
  message: '',
  type: 'GENERAL_FEEDBACK' as FeedbackType,
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true;
  try {
    await createFeedback({
      email: state.email,
      message: state.message,
      type: state.type,
    });

    state.email = '';
    state.message = '';
    state.type = 'GENERAL_FEEDBACK';
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
  <UDashboardPanel id="contact">
    <template #header>
      <UDashboardNavbar icon="i-heroicons-envelope">
        <template #leading>
          <UDashboardSidebarCollapse />
          <div class="ml-4">
            <h1 class="text-xl font-medium">{{ t('contact.title') }}</h1>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4">
        <UPageCard>
          <template #header>
            <div class="flex items-center space-x-2">
              <UIcon name="i-heroicons-chat-bubble-left-right" class="text-primary-500 size-5" />
              <h2 class="text-lg font-medium">{{ t('contact.form.title') }}</h2>
            </div>
          </template>

          <template #body>
            <UForm
              id="contactForm"
              :schema="schema"
              :state="state"
              class="space-y-6"
              @submit="onSubmit"
            >
              <UFormField name="email" :label="t('contact.form.labels.email')" required>
                <UInput
                  v-model="state.email"
                  name="email"
                  type="email"
                  :placeholder="t('contact.form.placeholders.email')"
                  icon="i-heroicons-envelope"
                  autocomplete="email"
                  class="w-full"
                />
              </UFormField>

              <UFormField name="type" :label="t('contact.form.labels.type')" required>
                <USelect
                  v-model="state.type"
                  name="type"
                  :items="feedbackTypes"
                  :placeholder="t('contact.form.placeholders.type')"
                  icon="i-heroicons-tag"
                  class="w-full"
                />
              </UFormField>

              <UFormField name="message" :label="t('contact.form.labels.message')" required>
                <UTextarea
                  v-model="state.message"
                  name="message"
                  :placeholder="t('contact.form.placeholders.message')"
                  :rows="6"
                  autoresize
                  class="w-full"
                />
              </UFormField>
            </UForm>
          </template>

          <template #footer>
            <div class="flex justify-end">
              <UButton
                type="submit"
                form="contactForm"
                :loading="loading"
                :disabled="loading"
                color="primary"
                icon="i-heroicons-paper-airplane"
              >
                {{ t('contact.form.button') }}
              </UButton>
            </div>
          </template>
        </UPageCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

<i18n lang="json">
{
  "en": {
    "contact": {
      "title": "Contact Us",
      "form": {
        "title": "Send Us a Message",
        "labels": {
          "email": "Email Address",
          "type": "Feedback Type",
          "message": "Your Message"
        },
        "placeholders": {
          "email": "Enter your email address",
          "type": "Select feedback type",
          "message": "How can we help you?"
        },
        "button": "Send Message"
      },
      "validation": {
        "email": {
          "required": "Email address is required",
          "invalid": "Please enter a valid email address"
        },
        "type": {
          "required": "Feedback type is required"
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
        "title": "Envoyez-nous un message",
        "labels": {
          "email": "Adresse email",
          "type": "Type de feedback",
          "message": "Votre message"
        },
        "placeholders": {
          "email": "Entrez votre adresse email",
          "type": "Sélectionnez le type de feedback",
          "message": "Comment pouvons-nous vous aider ?"
        },
        "button": "Envoyer le message"
      },
      "validation": {
        "email": {
          "required": "L'adresse email est requise",
          "invalid": "Veuillez entrer une adresse email valide"
        },
        "type": {
          "required": "Le type de feedback est requis"
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
        "title": "Envíenos un mensaje",
        "labels": {
          "email": "Correo electrónico",
          "type": "Tipo de comentario",
          "message": "Su mensaje"
        },
        "placeholders": {
          "email": "Ingrese su correo electrónico",
          "type": "Seleccione el tipo de comentario",
          "message": "¿Cómo podemos ayudarle?"
        },
        "button": "Enviar mensaje"
      },
      "validation": {
        "email": {
          "required": "El correo electrónico es obligatorio",
          "invalid": "Por favor, introduzca un correo electrónico válido"
        },
        "type": {
          "required": "El tipo de comentario es obligatorio"
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
