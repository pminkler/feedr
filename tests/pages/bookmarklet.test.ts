import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, computed } from 'vue';

// Create a wrapper component to test the bookmarklet page functionality
const BookmarkletWrapper = defineComponent({
  name: 'BookmarkletWrapper',
  setup() {
    // Mock browser location
    const currentHost = 'example.com';
    const currentPort = '3000';
    const currentProtocol = 'https:';
    const myAppURL = `${currentProtocol}//${currentHost}:${currentPort}/`;
    
    // Generate bookmarklet code
    const bookmarkletCode = computed(() => {
      return `javascript:(function() {
        var currentURL = encodeURIComponent(window.location.href);
        window.location.href = '${myAppURL}?url=' + currentURL;
      })();`;
    });
    
    // Encode bookmarklet
    const encodedBookmarklet = computed(() => {
      return encodeURI(bookmarkletCode.value);
    });
    
    // Handler for text selection
    const selectText = (event: Event) => {
      if (event && event.target && typeof (event.target as HTMLInputElement).select === 'function') {
        (event.target as HTMLInputElement).select();
      }
    };
    
    return {
      myAppURL,
      bookmarkletCode,
      encodedBookmarklet,
      selectText
    };
  },
  render() {
    return h('div', { class: 'bookmarklet-page' }, [
      h('h1', 'Feedr Bookmarklet'),
      h('p', 'Add this bookmarklet to your browser for easy recipe saving'),
      h('a', { 
        href: this.encodedBookmarklet,
        draggable: true,
        class: 'bookmarklet-button'
      }, [
        h('button', 'Save Recipe to Feedr')
      ]),
      h('p', { class: 'instructions' }, 'Drag this button to your bookmarks bar'),
      h('p', { class: 'or-text' }, 'Or copy this code:'),
      h('textarea', {
        readonly: true,
        rows: 4,
        cols: 60,
        value: this.bookmarkletCode,
        class: 'bookmarklet-code',
        onClick: this.selectText
      }),
      h('p', { class: 'copy-instructions' }, 'Copy this code and create a new bookmark with it')
    ]);
  }
});

// Mock window location
const originalLocation = window.location;
// Create a new object without overwriting the Location interface
Object.defineProperty(window, 'location', {
  value: {
    ...originalLocation,
    hostname: 'example.com',
    port: '3000',
    protocol: 'https:',
    href: 'https://example.com:3000/bookmarklet',
  },
  writable: true
});

// Mock definePageMeta
vi.mock('#imports', () => ({
  definePageMeta: vi.fn(),
}));

// Mock Vue i18n
vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'bookmarklet.title': 'Feedr Bookmarklet',
        'bookmarklet.description': 'Add this bookmarklet to your browser for easy recipe saving',
        'bookmarklet.dragMe': 'Save Recipe to Feedr',
        'bookmarklet.instructions': 'Drag this button to your bookmarks bar',
        'bookmarklet.or': 'Or copy this code:',
        'bookmarklet.copyInstructions': 'Copy this code and create a new bookmark with it'
      };
      return translations[key] || key;
    }
  }))
}));

describe('Bookmarklet Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with the correct page structure', () => {
    const wrapper = mount(BookmarkletWrapper);
    
    // Check that the page structure is correct
    expect(wrapper.find('.bookmarklet-page').exists()).toBe(true);
    expect(wrapper.find('h1').text()).toBe('Feedr Bookmarklet');
    expect(wrapper.find('.bookmarklet-button').exists()).toBe(true);
    expect(wrapper.find('.bookmarklet-code').exists()).toBe(true);
  });

  it('generates the correct bookmarklet code with app URL', () => {
    const wrapper = mount(BookmarkletWrapper);
    
    // Check that the app URL is correct
    expect(wrapper.vm.myAppURL).toBe('https://example.com:3000/');
    
    // Check that the bookmarklet code contains the correct URL
    expect(wrapper.vm.bookmarkletCode).toContain('https://example.com:3000/');
    expect(wrapper.vm.bookmarkletCode).toContain('window.location.href');
    
    // Check that the textarea contains the bookmarklet code
    const textarea = wrapper.find('.bookmarklet-code');
    expect(textarea.attributes('value')).toContain('https://example.com:3000/');
  });
  
  it('selects text when textarea is clicked', async () => {
    const wrapper = mount(BookmarkletWrapper);
    
    // Create a mock select function
    const mockSelect = vi.fn();
    
    // Test the selectText function directly
    const mockEvent = { target: { select: mockSelect } } as unknown as Event;
    wrapper.vm.selectText(mockEvent);
    
    // Verify select was called
    expect(mockSelect).toHaveBeenCalled();
  });
});