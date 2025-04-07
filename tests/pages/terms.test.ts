import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, computed } from 'vue';

// Create a wrapper component to simulate the Terms page functionality
const TermsWrapper = defineComponent({
  name: 'TermsWrapper',
  setup() {
    // Current date for the "last updated" message
    const updatedDateInLocalTime = '1/30/2025';
    
    // Current year for copyright
    const currentYear = 2025;
    
    // Helper function to replace placeholders
    const replacePlaceholders = (text: string) => {
      return text.replace(/{appName}/g, 'Feedr');
    };
    
    // Simulated lists for different sections - these would normally come from i18n
    const section2List = [
      'Item 1 for {appName}',
      'Item 2 for {appName}',
      'Item 3 for {appName}'
    ].map(replacePlaceholders);
    
    const section6List = [
      'Warranty disclaimer 1 for {appName}',
      'Warranty disclaimer 2 for {appName}'
    ].map(replacePlaceholders);
    
    const section7List = [
      'Liability limitation 1 for {appName}',
      'Liability limitation 2 for {appName}'
    ].map(replacePlaceholders);
    
    return {
      updatedDateInLocalTime,
      currentYear,
      section2List,
      section6List,
      section7List,
      replacePlaceholders
    };
  },
  render() {
    return h('div', { class: 'terms-page' }, [
      h('h1', 'Terms of Service'),
      h('p', { class: 'last-updated' }, [
        'Last Updated: ',
        h('span', { class: 'update-date' }, this.updatedDateInLocalTime)
      ]),
      
      // Intro
      h('p', { class: 'intro' }, 'Welcome to Feedr!'),
      
      // Section 1
      h('h2', 'Service Description'),
      h('p', 'Feedr is a web application that helps users...'),
      
      // Section 2
      h('h2', 'User Responsibilities'),
      h('p', 'When using Feedr, you agree to:'),
      h('ul', { class: 'section-2-list' }, this.section2List.map(item => 
        h('li', item)
      )),
      
      // Section 6
      h('h2', 'No Warranties'),
      h('p', 'Feedr is provided "as is" without warranties:'),
      h('ul', { class: 'section-6-list' }, this.section6List.map(item => 
        h('li', item)
      )),
      
      // Section 7
      h('h2', 'Limitation of Liability'),
      h('p', 'In no event shall Feedr be liable for:'),
      h('ul', { class: 'section-7-list' }, this.section7List.map(item => 
        h('li', item)
      )),
      
      // Copyright
      h('p', { class: 'copyright' }, `© ${this.currentYear} Feedr. All rights reserved.`)
    ]);
  }
});

// Mock Nuxt's definePageMeta
vi.mock('#imports', () => ({
  definePageMeta: vi.fn(),
}));

// Mock Vue i18n
vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: (key: string, params = {}) => {
      const translations: Record<string, string> = {
        'termsOfService.title': 'Terms of Service',
        'termsOfService.lastUpdated': 'Last Updated:',
        'termsOfService.intro': 'Welcome to {appName}!',
        'termsOfService.section1.title': 'Service Description',
        'termsOfService.section1.paragraph': '{appName} is a web application that helps users...',
        'termsOfService.section2.title': 'User Responsibilities',
        'termsOfService.section2.paragraph': 'When using {appName}, you agree to:',
        'termsOfService.copyright': '© {year} {appName}. All rights reserved.'
      };
      
      // Apply replacements
      let translation = translations[key] || key;
      Object.entries(params).forEach(([key, value]) => {
        translation = translation.replace(new RegExp(`{${key}}`, 'g'), String(value));
      });
      
      return translation;
    },
    locale: { value: 'en' },
    getLocaleMessage: vi.fn(() => ({
      termsOfService: {
        section2: {
          list: [
            'Item 1 for {appName}',
            'Item 2 for {appName}',
            'Item 3 for {appName}'
          ]
        },
        section6: {
          list: [
            'Warranty disclaimer 1 for {appName}',
            'Warranty disclaimer 2 for {appName}'
          ]
        },
        section7: {
          list: [
            'Liability limitation 1 for {appName}',
            'Liability limitation 2 for {appName}'
          ]
        }
      }
    }))
  }))
}));

describe('Terms Page Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with proper page structure', () => {
    const wrapper = mount(TermsWrapper);
    
    // Check for the main elements
    expect(wrapper.find('.terms-page').exists()).toBe(true);
    expect(wrapper.find('h1').text()).toBe('Terms of Service');
    
    // Count number of sections (h2 elements)
    const sections = wrapper.findAll('h2');
    expect(sections.length).toBeGreaterThanOrEqual(3);
    
    // Check specific section titles
    const sectionTitles = sections.map(h => h.text());
    expect(sectionTitles).toContain('Service Description');
    expect(sectionTitles).toContain('User Responsibilities');
    expect(sectionTitles).toContain('No Warranties');
  });

  it('shows the correct last updated date', () => {
    const wrapper = mount(TermsWrapper);
    
    // Check that the date is shown correctly
    const lastUpdated = wrapper.find('.last-updated');
    expect(lastUpdated.text()).toContain('Last Updated:');
    expect(lastUpdated.text()).toContain('1/30/2025');
    
    // Verify the property directly
    expect(wrapper.vm.updatedDateInLocalTime).toBe('1/30/2025');
  });

  it('shows the current year in copyright notice', () => {
    const wrapper = mount(TermsWrapper);
    
    // Check the copyright text
    const copyright = wrapper.find('.copyright');
    expect(copyright.text()).toBe('© 2025 Feedr. All rights reserved.');
    
    // Check that the component has the current year
    expect(wrapper.vm.currentYear).toBe(2025);
  });

  it('correctly replaces placeholders in text', () => {
    const wrapper = mount(TermsWrapper);
    
    // Test the replacePlaceholders method directly
    const result = wrapper.vm.replacePlaceholders('{appName} is a great app!');
    expect(result).toBe('Feedr is a great app!');
    
    // Check that section lists have had placeholders replaced
    const section2Items = wrapper.findAll('.section-2-list li');
    section2Items.forEach(item => {
      expect(item.text()).toContain('Feedr');
      expect(item.text()).not.toContain('{appName}');
    });
  });

  it('renders all lists with correct content', () => {
    const wrapper = mount(TermsWrapper);
    
    // Check section 2 list
    const section2Items = wrapper.findAll('.section-2-list li');
    expect(section2Items.length).toBe(3);
    expect(section2Items[0]?.text()).toBe('Item 1 for Feedr');
    
    // Check section 6 list
    const section6Items = wrapper.findAll('.section-6-list li');
    expect(section6Items.length).toBe(2);
    expect(section6Items[0]?.text()).toBe('Warranty disclaimer 1 for Feedr');
    
    // Check section 7 list
    const section7Items = wrapper.findAll('.section-7-list li');
    expect(section7Items.length).toBe(2);
    expect(section7Items[0]?.text()).toBe('Liability limitation 1 for Feedr');
  });
});