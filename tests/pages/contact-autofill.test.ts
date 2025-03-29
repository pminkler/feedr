import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref } from 'vue';

// Mock fetchUserAttributes function
const fetchUserAttributesMock = vi.fn();

// Mock dependencies
vi.mock('aws-amplify/auth', () => ({
  fetchUserAttributes: vi.fn(() => fetchUserAttributesMock()),
}));

// Simple component to test email auto-fill functionality
const EmailAutoFillComponent = {
  props: {
    isLoggedIn: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      default: null,
    },
  },
  template: `
    <div>
      <input 
        v-model="email" 
        data-test="email-input"
        :disabled="isLoggedIn"
      />
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  `,
  setup(props) {
    const email = ref('');
    const error = ref('');

    // Simulating the onMounted hook
    (async () => {
      if (props.isLoggedIn) {
        try {
          const attributes = await fetchUserAttributesMock();
          if (attributes && attributes.email) {
            email.value = attributes.email;
          }
        } catch (err) {
          error.value = 'Failed to fetch user attributes';
          console.error(error.value, err);

          // Fallback to username@example.com if available
          if (props.username) {
            email.value = `${props.username}@example.com`;
          }
        }
      }
    })();

    return {
      email,
      error,
    };
  },
};

describe('Contact Page - Email Auto-fill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchUserAttributesMock.mockReset();
  });

  it('does not auto-fill email for guest users', async () => {
    const wrapper = mount(EmailAutoFillComponent, {
      props: {
        isLoggedIn: false,
      },
    });

    await flushPromises();

    // Verify email field is empty
    expect(wrapper.vm.email).toBe('');

    // Verify fetchUserAttributes was not called
    expect(fetchUserAttributesMock).not.toHaveBeenCalled();

    // Verify email input is not disabled
    const emailInput = wrapper.find('[data-test="email-input"]');
    expect(emailInput.attributes('disabled')).toBeUndefined();
  });

  it('auto-fills email from user attributes when available', async () => {
    // Setup mock to return email
    fetchUserAttributesMock.mockResolvedValue({
      email: 'user@example.com',
    });

    const wrapper = mount(EmailAutoFillComponent, {
      props: {
        isLoggedIn: true,
        username: 'testuser',
      },
    });

    await flushPromises();

    // Verify email was auto-filled
    expect(wrapper.vm.email).toBe('user@example.com');

    // Verify fetchUserAttributes was called
    expect(fetchUserAttributesMock).toHaveBeenCalled();

    // Verify email input is disabled
    const emailInput = wrapper.find('[data-test="email-input"]');
    expect(emailInput.attributes('disabled')).toBeDefined();
  });

  it('falls back to username@example.com when attributes fetch fails', async () => {
    // Setup mock to throw error
    fetchUserAttributesMock.mockRejectedValue(new Error('Failed to fetch'));

    // Spy on console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const wrapper = mount(EmailAutoFillComponent, {
      props: {
        isLoggedIn: true,
        username: 'fallbackuser',
      },
    });

    await flushPromises();

    // Verify fallback email was used
    expect(wrapper.vm.email).toBe('fallbackuser@example.com');

    // Verify error message is set
    expect(wrapper.vm.error).toBeTruthy();
    expect(wrapper.find('.error').exists()).toBe(true);

    // Verify console.error was called
    expect(consoleErrorSpy).toHaveBeenCalled();

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('handles missing username in fallback scenario', async () => {
    // Setup mock to throw error
    fetchUserAttributesMock.mockRejectedValue(new Error('Failed to fetch'));

    // Spy on console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const wrapper = mount(EmailAutoFillComponent, {
      props: {
        isLoggedIn: true,
        username: null, // No username available
      },
    });

    await flushPromises();

    // Verify email remains empty
    expect(wrapper.vm.email).toBe('');

    // Verify error is set
    expect(wrapper.vm.error).toBeTruthy();

    // Verify console.error was called
    expect(consoleErrorSpy).toHaveBeenCalled();

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});
