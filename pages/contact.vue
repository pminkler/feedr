<script setup lang="ts">
import { object, string, type InferType } from "yup";
import type { FormSubmitEvent } from "#ui/types";
import { reactive, ref } from "vue";
import { useFeedback } from "@/composables/useFeedback";
import { useI18n } from "vue-i18n";

definePageMeta({
  layout: "single-page",
});

const { t } = useI18n();

const { createFeedback } = useFeedback();
const loading = ref(false);
const toast = useToast();

// Build the Yup validation schema using translations
const schema = object({
  email: string()
    .email(t("contact.validation.email.invalid"))
    .required(t("contact.validation.email.required")),
  message: string()
    .min(10, t("contact.validation.message.min"))
    .required(t("contact.validation.message.required")),
});

type Schema = InferType<typeof schema>;

const state = reactive({
  email: "",
  message: "",
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true;
  try {
    await createFeedback({
      email: state.email,
      message: state.message,
    });

    state.email = "";
    state.message = "";
    toast.add({
      id: "feedback_success",
      title: t("contact.toast.success.title"),
      description: t("contact.toast.success.description"),
      icon: "i-octicon-check-circle-24",
      timeout: 5000,
    });
  } catch (error) {
    console.error(error);
    toast.add({
      id: "feedback_failure",
      title: t("contact.toast.failure.title"),
      description: t("contact.toast.failure.description"),
      icon: "i-octicon-alert-24",
      timeout: 5000,
      color: "red",
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UContainer class="w-full md:w-3/4 lg:w-1/2">
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormGroup :label="t('contact.form.labels.email')" name="email">
        <UInput
          v-model="state.email"
          :placeholder="t('contact.form.placeholders.email')"
        />
      </UFormGroup>

      <UFormGroup :label="t('contact.form.labels.message')" name="message">
        <UTextarea
          v-model="state.message"
          :placeholder="t('contact.form.placeholders.message')"
        />
      </UFormGroup>

      <UButton type="submit" :loading="loading" block>
        {{ t("contact.form.button") }}
      </UButton>
    </UForm>
  </UContainer>
</template>
