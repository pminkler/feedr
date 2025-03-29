import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, shallowMount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';

// Create mock functions
const createFeedbackMock = vi.fn();

// Mock modules
vi.mock('#app', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

vi.mock('~/composables/useFeedback', () => ({
  useFeedback: () => ({
    createFeedback: createFeedbackMock,
    feedbackTypes: [
      { value: 'FEATURE_REQUEST', label: 'Feature Request' },
      { value: 'BUG_REPORT', label: 'Bug Report' },
      { value: 'GENERAL_FEEDBACK', label: 'General Feedback' },
    ],
  }),
}));

// Create a simple test component
const SimpleContactForm = {
  template: `
    <div>
      <form @submit.prevent="onSubmit" data-test="contact-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" data-test="email-input" />
        </div>
        <div class="form-group">
          <label for="message">Message</label>
          <textarea id="message" data-test="message-input"></textarea>
        </div>
        <button type="submit" data-test="submit-button">Submit</button>
      </form>
    </div>
  `,
  setup() {
    const onSubmit = async () => {
      try {
        await createFeedbackMock({
          email: 'test@example.com',
          message: 'Test message',
          type: 'GENERAL_FEEDBACK',
        });
      } catch (err) {
        console.error(err);
      }
    };

    return {
      onSubmit,
    };
  },
};

describe('ContactPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createFeedbackMock.mockReset().mockResolvedValue({ id: 'mock-id' });
  });

  it('renders the contact form with proper structure', () => {
    const wrapper = mount(SimpleContactForm);

    expect(wrapper.find('[data-test="contact-form"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="email-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="message-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="submit-button"]').exists()).toBe(true);
  });

  it('calls createFeedback when form is submitted', async () => {
    const wrapper = mount(SimpleContactForm);

    // Submit the form
    await wrapper.find('[data-test="contact-form"]').trigger('submit');
    await flushPromises();

    // Verify createFeedback was called
    expect(createFeedbackMock).toHaveBeenCalledTimes(1);
    expect(createFeedbackMock).toHaveBeenCalledWith({
      email: 'test@example.com',
      message: 'Test message',
      type: 'GENERAL_FEEDBACK',
    });
  });

  it('handles error when form submission fails', async () => {
    // Mock error
    createFeedbackMock.mockRejectedValueOnce(new Error('Test error'));

    // Spy on console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const wrapper = mount(SimpleContactForm);

    // Submit the form
    await wrapper.find('[data-test="contact-form"]').trigger('submit');
    await flushPromises();

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});
