<script setup lang="ts">
import { object, string, type InferType } from "yup";
import type { FormSubmitEvent } from "#ui/types";
import { reactive, ref } from "vue";
import { useFeedback } from "@/composables/useFeedback";

definePageMeta({
  layout: "single-page",
});

const { createFeedback } = useFeedback();
const loading = ref(false);
const toast = useToast();

const schema = object({
  email: string().email("Invalid email").required("Email is required"),
  message: string()
    .min(10, "Message must be at least 10 characters")
    .required("Message is required"),
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
      title: "Feedback submitted successfully!",
      description: "Thank you for your feedback.",
      icon: "i-octicon-check-circle-24",
      timeout: 5000,
    });
  } catch (error) {
    console.error(error);
    toast.add({
      id: "feedback_failure",
      title: "Failed to submit feedback.",
      description: "Please try again later.",
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
      <UFormGroup label="Email" name="email">
        <UInput v-model="state.email" />
      </UFormGroup>

      <UFormGroup label="Message" name="message">
        <UTextarea v-model="state.message" placeholder="Enter your message" />
      </UFormGroup>

      <UButton type="submit" :loading="loading" block>
        Submit Feedback
      </UButton>
    </UForm>
  </UContainer>
</template>
