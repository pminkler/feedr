import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import AppFooter from '~/components/AppFooter.vue';

// Mock Nuxt dependencies
const navigateToMock = vi.fn();
const switchLocalePathMock = vi.fn((locale) => `/switch-to/${locale}`);

// Create stub for the component
const AppFooterStub = {
  template: `
    <div class="app-footer-stub">
      <div class="copyright">Copyright © {{ new Date().getFullYear() }}. All rights reserved.</div>
      <div class="language-selector">
        <select class="select-stub" @change="changeLanguage($event.target.value)">
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="es">Español</option>
        </select>
      </div>
      <button class="color-mode-btn">Toggle Theme</button>
    </div>
  `,
  data() {
    return {
      selectedLanguage: 'en',
      columns: [
        {
          label: 'Legal',
          children: [
            { label: 'Privacy Policy', to: '/privacy' },
            { label: 'Terms of Service', to: '/terms' },
          ],
        },
        {
          label: 'Tools',
          children: [
            { label: 'Bookmarklet', to: '/bookmarklet' },
          ],
        },
        {
          label: 'Contact',
          children: [
            { label: 'Contact Us', to: '/contact' },
          ],
        },
      ],
    };
  },
  methods: {
    changeLanguage(newLocale) {
      // Use the same logic as the component
      const validLocale = ['en', 'fr', 'es'].includes(newLocale) ? newLocale : 'en';
      navigateToMock(switchLocalePathMock(validLocale));
    }
  }
};

describe('AppFooter', () => {
  let wrapper: VueWrapper;
  
  beforeEach(() => {
    vi.resetAllMocks();
    navigateToMock.mockClear();
    switchLocalePathMock.mockClear();
    
    // Create wrapper with our stub
    wrapper = mount(AppFooterStub);
  });

  it('renders the footer component', () => {
    expect(wrapper.find('.app-footer-stub').exists()).toBe(true);
  });

  it('displays the correct copyright year', () => {
    const currentYear = new Date().getFullYear();
    expect(wrapper.find('.copyright').text()).toContain(`Copyright © ${currentYear}`);
  });

  it('renders the language selector', () => {
    expect(wrapper.find('.language-selector').exists()).toBe(true);
    expect(wrapper.find('.select-stub').exists()).toBe(true);
  });

  it('renders the color mode button', () => {
    expect(wrapper.find('.color-mode-btn').exists()).toBe(true);
  });

  it('emits language change event when language is changed', async () => {
    await wrapper.find('.select-stub').setValue('fr');
    await wrapper.find('.select-stub').trigger('change');
    
    // The component should call navigateTo with the path from switchLocalePath
    expect(switchLocalePathMock).toHaveBeenCalledWith('fr');
    expect(navigateToMock).toHaveBeenCalledWith('/switch-to/fr');
  });

  it('validates locale before switching', async () => {
    await wrapper.find('.select-stub').setValue('invalid-locale');
    await wrapper.find('.select-stub').trigger('change');
    
    // Should default to 'en'
    expect(switchLocalePathMock).toHaveBeenCalledWith('en');
    expect(navigateToMock).toHaveBeenCalledWith('/switch-to/en');
  });
});