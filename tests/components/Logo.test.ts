import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import Logo from '~/components/Logo.vue';
import LogoColor from '~/components/LogoColor.vue';
import LogoBlack from '~/components/LogoBlack.vue';

// Create a mock useColorMode function
const mockUseColorMode = vi.fn().mockReturnValue({ value: 'light' });

// Mock the global function
vi.stubGlobal('useColorMode', mockUseColorMode);

describe('Logo.vue', () => {
  let wrapper: ReturnType<typeof shallowMount>;
  
  beforeEach(() => {
    // Create a shallow mount of the Logo component
    wrapper = shallowMount(Logo);
  });
  
  it('renders LogoBlack when color mode is light', () => {
    // Check that LogoBlack is rendered in light mode
    expect(wrapper.findComponent(LogoBlack).exists()).toBe(true);
    expect(wrapper.findComponent(LogoColor).exists()).toBe(false);
  });
  
  it('renders LogoColor when color mode is dark', async () => {
    // Update the mock to return 'dark'
    mockUseColorMode.mockReturnValue({ value: 'dark' });
    
    // Re-mount the component
    wrapper = shallowMount(Logo);
    
    // Check that LogoColor is rendered in dark mode
    expect(wrapper.findComponent(LogoColor).exists()).toBe(true);
    expect(wrapper.findComponent(LogoBlack).exists()).toBe(false);
  });
});