import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LoadingMessages from '~/components/LoadingMessages.vue';

// Mock the i18n composable
vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: vi.fn((key) => key === '$locale' ? 'en' : 'Loading...'),
  })),
}));

// Utility to mock timers
vi.useFakeTimers();

describe('LoadingMessages.vue', () => {
  let wrapper;
  
  beforeEach(() => {
    // Mock Math.random to return predictable values
    const randomMock = vi.spyOn(Math, 'random');
    randomMock.mockReturnValue(0.1); // Return first message
    
    // Mount the component
    wrapper = mount(LoadingMessages);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('renders with a loading message', () => {
    // Check that a message is displayed
    expect(wrapper.text()).toBeTruthy();
    // Since we're using the French locale in our test, check for the French message
    expect(wrapper.text()).toContain('Préparation des recettes...');
  });
  
  it('changes the message after timer interval', async () => {
    const initialMessage = wrapper.text();
    
    // Change the Math.random return value for a different message
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    
    // Fast-forward time to trigger the interval
    vi.advanceTimersByTime(5000);
    
    // Wait for Vue to update
    await wrapper.vm.$nextTick();
    
    // Expect the message to have changed
    expect(wrapper.text()).not.toBe(initialMessage);
  });
  
  it('uses the correct locale for messages', async () => {
    // Mock i18n to return a different locale
    vi.mock('vue-i18n', () => ({
      useI18n: vi.fn(() => ({
        t: vi.fn((key) => key === '$locale' ? 'fr' : 'Chargement...'),
      })),
    }));
    
    // Remount component to pick up the new locale
    wrapper = mount(LoadingMessages);
    
    // Expect a French message
    expect(wrapper.text()).toContain('Préparation des recettes...');
  });
  
  it('cleans up the interval on unmount', () => {
    // Spy on clearInterval
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');
    
    // Unmount the component
    wrapper.unmount();
    
    // Check that clearInterval was called
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});