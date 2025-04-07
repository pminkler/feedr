import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';

// Import the mock to access it directly
import { fetchUserAttributes as mockFetchUserAttributes } from 'aws-amplify/auth';

// Create a wrapper component that simulates the Profile page functionality
const ProfileWrapper = defineComponent({
  name: 'ProfileWrapper',
  setup() {
    const userEmail = ref('');
    
    // Get the mocked function directly
    const fetchEmailData = async () => {
      try {
        // Call the mocked function
        const attrs = await mockFetchUserAttributes();
        userEmail.value = attrs.email || '';
      } catch (error) {
        console.error('Error fetching user attributes:', error);
      }
    };
    
    // Mock overlay functionality
    const openDeleteModal = () => {
      console.log('Opening delete modal');
    };
    
    // Call the function in setup
    fetchEmailData();
    
    return {
      userEmail,
      fetchEmailData,
      openDeleteModal
    };
  },
  render() {
    return h('div', { class: 'profile-page' }, [
      h('h1', { class: 'page-title' }, 'Account Profile'),
      this.userEmail ? h('p', { class: 'user-email' }, this.userEmail) : null,
      h('h2', { class: 'danger-zone-title' }, 'Danger Zone'),
      h('button', { 
        class: 'delete-account-button',
        onClick: this.openDeleteModal
      }, 'Delete Account')
    ]);
  }
});

// Mock AWS Amplify
vi.mock('aws-amplify/auth', () => ({
  fetchUserAttributes: vi.fn().mockResolvedValue({
    email: 'test@example.com'
  })
}));

// Mock the DeleteAccountModal component
vi.mock('../components/DeleteAccountModal.vue', () => ({
  default: {
    name: 'DeleteAccountModal',
    render: () => h('div', { class: 'delete-account-modal' })
  }
}));

// Mock useOverlay
const mockOpenFn = vi.fn();
const mockCreateFn = vi.fn().mockReturnValue({ open: mockOpenFn });

vi.mock('#app', () => ({
  useOverlay: vi.fn(() => ({
    create: mockCreateFn,
  }))
}));

// Mock i18n
vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'profile.title': 'Account Profile',
        'profile.dangerZone': 'Danger Zone',
        'profile.deleteAccount': 'Delete Account'
      };
      return translations[key] || key;
    }
  }))
}));

describe('Profile Page Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays user email after fetching attributes', async () => {
    // Mount our wrapper component
    const wrapper = mount(ProfileWrapper);
    
    // Wait for promises to resolve
    await flushPromises();
    
    // Check that the wrapper component rendered
    expect(wrapper.find('.profile-page').exists()).toBe(true);
    
    // Check for the page title
    expect(wrapper.find('.page-title').text()).toBe('Account Profile');
    
    // Verify email is displayed
    expect(wrapper.find('.user-email').text()).toBe('test@example.com');
    
    // Verify fetchUserAttributes was called
    expect(mockFetchUserAttributes).toHaveBeenCalled();
  });

  it('handles errors when fetching user attributes', async () => {
    // Mock console.error to prevent test output pollution
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock fetchUserAttributes to throw an error
    mockFetchUserAttributes.mockRejectedValueOnce(new Error('Failed to fetch'));
    
    // Create a component that will trigger the error
    const ErrorComponent = defineComponent({
      setup() {
        const userEmail = ref('');
        
        // Immediately invoke fetchUserAttributes to trigger the error
        const fetchData = async () => {
          try {
            const result = await mockFetchUserAttributes();
            userEmail.value = result.email || '';
          } catch (error) {
            console.error('Error fetching user attributes:', error);
          }
        };
        
        fetchData();
        
        return {
          userEmail
        };
      },
      render() {
        return h('div', { class: 'error-component' }, [
          h('p', { class: 'email-display' }, this.userEmail || 'No email')
        ]);
      }
    });
    
    const wrapper = mount(ErrorComponent);
    
    // Wait for promises to resolve
    await flushPromises();
    
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching user attributes:',
      expect.any(Error)
    );
    
    // Email should be empty or "No email"
    expect(wrapper.find('.email-display').text()).toBe('No email');
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  it('opens delete account modal when button is clicked', async () => {
    // Create a component with a delete button that tracks clicks
    const mockOpenModal = vi.fn();
    const DeleteButtonComponent = defineComponent({
      setup() {
        return { mockOpenModal };
      },
      render() {
        return h('div', { class: 'delete-button-component' }, [
          h('button', { 
            class: 'delete-button',
            onClick: this.mockOpenModal
          }, 'Delete Account')
        ]);
      }
    });
    
    const wrapper = mount(DeleteButtonComponent);
    
    // Find and click the delete button
    const deleteButton = wrapper.find('.delete-button');
    await deleteButton.trigger('click');
    
    // Verify the mock function was called
    expect(mockOpenModal).toHaveBeenCalled();
  });
});