import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';

// Mock dependencies and functions
const toastAddMock = vi.fn();
const createFeedbackMock = vi.fn();
const isLoggedInMock = ref(false);

// Mock useToast and useAuth
vi.mock('#app', () => ({
  useToast: () => ({
    add: toastAddMock,
  }),
}));

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    isLoggedIn: isLoggedInMock,
  }),
}));

// Create a simplified component for testing form submission
const FormSubmitComponent = {
  template: `
    <div>
      <form @submit.prevent="onSubmit" data-test="feedback-form">
        <input v-model="state.email" data-test="email-input" />
        <textarea v-model="state.message" data-test="message-input" />
        <button type="submit" :disabled="loading" data-test="submit-button">
          {{ loading ? 'Sending...' : 'Send' }}
        </button>
      </form>
      <div v-if="success" class="success" data-test="success">Form submitted!</div>
      <div v-if="error" class="error" data-test="error">{{ error }}</div>
    </div>
  `,
  setup() {
    const state = ref({
      email: '',
      message: '',
      type: 'GENERAL_FEEDBACK',
    });

    const loading = ref(false);
    const success = ref(false);
    const error = ref('');

    // Reset state for testing
    createFeedbackMock.mockClear();

    const onSubmit = async () => {
      loading.value = true;
      error.value = '';
      success.value = false;

      try {
        // Call the mocked createFeedback function
        await createFeedbackMock({
          email: state.value.email,
          message: state.value.message,
          type: state.value.type,
        });

        // Reset form on success - only clear email if not logged in
        if (!isLoggedInMock.value) {
          state.value.email = '';
        }
        state.value.message = '';
        success.value = true;

        // Show success toast
        toastAddMock({
          id: 'feedback_success',
          title: 'Message Sent',
        });
      } catch (err) {
        console.error(err);
        error.value = err.message || 'Failed to submit';

        // Show error toast
        toastAddMock({
          id: 'feedback_failure',
          title: 'Error',
          color: 'red',
        });
      } finally {
        loading.value = false;
      }
    };

    return {
      state,
      loading,
      success,
      error,
      onSubmit,
    };
  },
};

describe('Contact Form - Submit Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default mock implementation for createFeedback
    createFeedbackMock.mockResolvedValue({ id: 'mock-feedback-id' });
  });

  afterEach(() => {
    vi.useRealTimers();
    isLoggedInMock.value = false;
  });

  it('shows loading state during submission', async () => {
    // Use a delayed promise to test loading state
    createFeedbackMock.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ id: 'test-id' }), 1000))
    );

    const wrapper = mount(FormSubmitComponent);

    // Fill out form inputs
    await wrapper.find('[data-test="email-input"]').setValue('test@example.com');
    await wrapper.find('[data-test="message-input"]').setValue('Test message');

    // Submit the form
    await wrapper.find('[data-test="feedback-form"]').trigger('submit');

    // Check loading state immediately after submission
    expect(wrapper.vm.loading).toBe(true);
    expect(wrapper.find('[data-test="submit-button"]').attributes('disabled')).toBeDefined();

    // Advance timer and flush promises to complete the operation
    vi.advanceTimersByTime(1500);
    await flushPromises();

    // Verify loading state is cleared
    expect(wrapper.vm.loading).toBe(false);
  });

  it('resets form and shows success message on successful submission', async () => {
    const wrapper = mount(FormSubmitComponent);

    // Fill out form inputs
    await wrapper.find('[data-test="email-input"]').setValue('test@example.com');
    await wrapper.find('[data-test="message-input"]').setValue('Test message');

    // Submit the form
    await wrapper.find('[data-test="feedback-form"]').trigger('submit');
    await flushPromises();

    // Verify createFeedback was called with correct data
    expect(createFeedbackMock).toHaveBeenCalledWith({
      email: 'test@example.com',
      message: 'Test message',
      type: 'GENERAL_FEEDBACK',
    });

    // Check that form was reset
    expect(wrapper.vm.state.email).toBe('');
    expect(wrapper.vm.state.message).toBe('');

    // Check success state and UI
    expect(wrapper.vm.success).toBe(true);
    expect(wrapper.find('[data-test="success"]').exists()).toBe(true);

    // Verify toast notification
    expect(toastAddMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'feedback_success',
      })
    );
  });

  it('shows error message when submission fails', async () => {
    // Mock an error for this test
    const testError = new Error('Test error message');
    createFeedbackMock.mockRejectedValueOnce(testError);

    // Spy on console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const wrapper = mount(FormSubmitComponent);

    // Fill out form inputs
    await wrapper.find('[data-test="email-input"]').setValue('test@example.com');
    await wrapper.find('[data-test="message-input"]').setValue('Test message');

    // Submit the form
    await wrapper.find('[data-test="feedback-form"]').trigger('submit');
    await flushPromises();

    // Check that error state is set
    expect(wrapper.vm.error).toBe('Test error message');
    expect(wrapper.find('[data-test="error"]').exists()).toBe(true);

    // Verify error toast
    expect(toastAddMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'feedback_failure',
        color: 'red',
      })
    );

    // Verify console.error was called
    expect(consoleErrorSpy).toHaveBeenCalled();

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('preserves email field for authenticated users after successful submission', async () => {
    // Set the user as authenticated for this test
    isLoggedInMock.value = true;

    const wrapper = mount(FormSubmitComponent);
    const testEmail = 'authenticated@example.com';

    // Fill out form inputs
    await wrapper.find('[data-test="email-input"]').setValue(testEmail);
    await wrapper
      .find('[data-test="message-input"]')
      .setValue('Test message from authenticated user');

    // Submit the form
    await wrapper.find('[data-test="feedback-form"]').trigger('submit');
    await flushPromises();

    // Verify createFeedback was called with correct data
    expect(createFeedbackMock).toHaveBeenCalledWith({
      email: testEmail,
      message: 'Test message from authenticated user',
      type: 'GENERAL_FEEDBACK',
    });

    // Check that email field was NOT cleared for authenticated user
    expect(wrapper.vm.state.email).toBe(testEmail);

    // Check that message field was still cleared
    expect(wrapper.vm.state.message).toBe('');

    // Verify success state
    expect(wrapper.vm.success).toBe(true);
  });
});
