// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, config, flushPromises } from '@vue/test-utils';
import UserMenu from '../../components/UserMenu.vue';

// Configure Vue Test Utils
config.global.stubs = {
  UDropdownMenu: {
    props: ['items', 'content', 'ui'],
    template: '<div class="dropdown-menu"><slot /></div>',
  },
  UButton: {
    props: ['color', 'variant', 'block', 'square', 'label', 'trailing-icon', 'ui'],
    template: '<button :class="[color, variant]" :data-label="label"><slot /><slot name="leading" /></button>',
  },
  UIcon: {
    props: ['name', 'class'],
    template: '<div class="icon" :class="name"></div>',
  },
};

// Mock AWS Amplify
vi.mock('aws-amplify/auth', () => {
  return {
    fetchUserAttributes: vi.fn(),
  };
});

// Import the mocked module to get access to the mock functions
import { fetchUserAttributes } from 'aws-amplify/auth';

// Mock useAuth composable
const mockCurrentUser = { value: null };
vi.mock('../../composables/useAuth', () => ({
  useAuth: vi.fn(() => ({
    currentUser: mockCurrentUser,
  })),
}));

// Mock color mode
const mockColorMode = { value: 'light' };
global.useColorMode = vi.fn(() => mockColorMode);

// Mock vue-i18n
global.useI18n = vi.fn(() => ({
  t: (key) => key,
}));

// Mock localePath
global.useLocalePath = vi.fn(() => (path) => path);

// Mock console.error
console.error = vi.fn();

// Setup fake timers
vi.useFakeTimers();

describe('UserMenu.vue', () => {
  let wrapper;

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    mockCurrentUser.value = null;
    mockColorMode.value = 'light';
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it('renders correctly with default props', async () => {
    // Mock auth user data
    fetchUserAttributes.mockResolvedValue({ email: 'test@example.com' });
    
    wrapper = mount(UserMenu);
    
    // Flush promises for mounted hook to execute
    await vi.runAllTimers();
    await flushPromises();
    
    // Should have called fetchUserAttributes
    expect(fetchUserAttributes).toHaveBeenCalled();
    
    // Email should be updated in the computed property
    expect(wrapper.vm.userEmail).toBe('test@example.com');
  });

  it('handles collapsed mode', async () => {
    fetchUserAttributes.mockResolvedValue({ email: 'test@example.com' });
    
    wrapper = mount(UserMenu, {
      props: {
        collapsed: true,
      }
    });
    
    await vi.runAllTimers();
    await flushPromises();
    
    // Check that the button correctly reflects the collapsed state
    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.attributes('data-label')).toBeUndefined();
  });

  it('falls back to username when email is not available', async () => {
    // No email in attributes
    fetchUserAttributes.mockResolvedValue({});
    
    // Set username instead
    mockCurrentUser.value = { username: 'testuser' };
    
    wrapper = mount(UserMenu);
    
    // Wait for mounted hook to resolve
    await vi.runAllTimers();
    await flushPromises();
    
    // Should use username as fallback
    expect(wrapper.vm.userEmail).toBe('testuser');
  });

  it('falls back to guest label when no user data is available', async () => {
    // No email in attributes
    fetchUserAttributes.mockResolvedValue({});
    
    // No current user
    mockCurrentUser.value = null;
    
    wrapper = mount(UserMenu);
    
    // Wait for mounted hook to resolve
    await vi.runAllTimers();
    await flushPromises();
    
    // Should use guest label
    expect(wrapper.vm.userEmail).toBe('userMenu.guest');
  });

  it('handles error when fetching user attributes', async () => {
    // Mock an error
    fetchUserAttributes.mockRejectedValue(new Error('Failed to fetch'));
    
    wrapper = mount(UserMenu);
    
    // Wait for mounted hook to resolve
    await vi.runAllTimers();
    await flushPromises();
    
    // Should log the error
    expect(console.error).toHaveBeenCalledWith(
      'Error fetching user attributes:',
      expect.any(Error)
    );
    
    // Should fall back to guest label
    expect(wrapper.vm.userEmail).toBe('userMenu.guest');
  });

  it('creates menu items correctly', async () => {
    fetchUserAttributes.mockResolvedValue({ email: 'test@example.com' });
    
    wrapper = mount(UserMenu);
    
    // Wait for mounted hook to resolve
    await vi.runAllTimers();
    await flushPromises();
    
    // Check items structure
    const items = wrapper.vm.items;
    expect(items).toHaveLength(4); // 4 sections
    
    // Check user label
    expect(items[0][0].type).toBe('label');
    expect(items[0][0].label).toBe('test@example.com');
    
    // Check profile item
    expect(items[1][0].label).toBe('userMenu.profile');
    expect(items[1][0].to).toBe('/profile');
    
    // Check theme submenu
    expect(items[2][0].label).toBe('userMenu.theme');
    expect(items[2][0].children).toHaveLength(2);
    expect(items[2][0].children[0].label).toBe('userMenu.light');
    expect(items[2][0].children[1].label).toBe('userMenu.dark');
    
    // Check logout item
    expect(items[3][0].label).toBe('userMenu.logout');
    expect(items[3][0].to).toBe('/logout');
  });

  it('changes color mode when theme is switched', async () => {
    fetchUserAttributes.mockResolvedValue({ email: 'test@example.com' });
    
    wrapper = mount(UserMenu);
    
    // Wait for mounted hook to resolve
    await vi.runAllTimers();
    await flushPromises();
    
    // Event object to prevent default
    const mockEvent = { preventDefault: vi.fn() };
    
    // Get the theme items
    const themeItems = wrapper.vm.items[2][0].children;
    
    // Verify initial state
    expect(mockColorMode.value).toBe('light');
    
    // Change to dark theme
    themeItems[1].onSelect(mockEvent);
    
    // Verify color mode was changed
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockColorMode.value).toBe('dark');
  });
});