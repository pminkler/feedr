// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import InstacartButton from '../../components/InstacartButton.vue';

// Mock window.open
const mockWindowOpen = vi.fn();
vi.stubGlobal('open', mockWindowOpen);

// Mock console.error
console.error = vi.fn();

// Mock the recipe store
const mockGenerateInstacartUrl = vi.fn();
vi.mock('../../stores/recipes', () => ({
  useRecipeStore: vi.fn(() => ({
    generateInstacartUrl: mockGenerateInstacartUrl,
  })),
}));

// Mock toast notification
const mockToast = {
  add: vi.fn(),
};

// Mock imports
global.useToast = vi.fn(() => mockToast);
global.useI18n = vi.fn(() => ({
  t: (key: string) => key,
}));

describe('InstacartButton.vue', () => {
  let wrapper;

  beforeEach(() => {
    // Reset mocks before each test
    mockGenerateInstacartUrl.mockReset();
    mockToast.add.mockReset();
    mockWindowOpen.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  it('renders with default props', () => {
    wrapper = mount(InstacartButton);
    
    // Button should exist
    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    
    // Button should be disabled when no ingredients
    expect(button.attributes('disabled')).toBeDefined();
    
    // There's an image in the button
    expect(wrapper.find('button img').exists()).toBe(true);
  });

  it('renders with ingredients', () => {
    const ingredients = [
      { name: 'flour', quantity: '2', unit: 'cups' },
      { name: 'sugar', quantity: '1/2', unit: 'cup' },
    ];
    
    wrapper = mount(InstacartButton, {
      props: {
        ingredients,
      }
    });
    
    // Button should exist and be enabled
    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.attributes('disabled')).toBeUndefined();
  });

  it('shows compact mode without disclaimer text', () => {
    wrapper = mount(InstacartButton, {
      props: {
        compact: true,
      }
    });
    
    // Affiliate disclosure should not be visible
    expect(wrapper.find('p').exists()).toBe(false);
  });

  it('shows affiliate disclosure text when not in compact mode', () => {
    wrapper = mount(InstacartButton);
    
    // Affiliate disclosure should be visible
    expect(wrapper.find('p').exists()).toBe(true);
    expect(wrapper.find('p').text()).toBe('recipe.instacart.affiliate.disclosure');
  });

  it('handles successful Instacart URL generation', async () => {
    const ingredients = [
      { name: 'flour', quantity: '2', unit: 'cups' },
      { name: 'sugar', quantity: '1/2', unit: 'cup' },
    ];
    
    const recipeData = {
      title: 'Test Recipe',
      instructions: ['Step 1', 'Step 2'],
      imageUrl: 'https://example.com/image.jpg',
    };
    
    // Mock successful response
    mockGenerateInstacartUrl.mockResolvedValue({
      url: 'https://instacart.com/cart/123',
      ingredients: ingredients.length,
      expiresAt: '2025-04-30T12:00:00Z',
    });
    
    wrapper = mount(InstacartButton, {
      props: {
        ingredients,
        recipeTitle: recipeData.title,
        recipeInstructions: recipeData.instructions,
        recipeImageUrl: recipeData.imageUrl,
      }
    });
    
    // Click the button
    await wrapper.find('button').trigger('click');
    
    // Verify loading state was shown
    expect(wrapper.vm.isGenerating).toBe(false); // Should be reset after completion
    
    // Verify function was called with correct parameters
    expect(mockGenerateInstacartUrl).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'flour', quantity: '2', unit: 'cups' }),
        expect.objectContaining({ name: 'sugar', quantity: '1/2', unit: 'cup' }),
      ]),
      expect.objectContaining({
        title: 'Test Recipe',
        instructions: ['Step 1', 'Step 2'],
        imageUrl: 'https://example.com/image.jpg',
      })
    );
    
    // Check window.open was called
    expect(mockWindowOpen).toHaveBeenCalledWith('https://instacart.com/cart/123', '_blank');
    
    // Check toast was shown
    expect(mockToast.add).toHaveBeenCalledWith({
      title: 'recipe.instacart.success.title',
      description: 'recipe.instacart.success.description',
      color: 'success',
    });
  });

  it('handles error during Instacart URL generation', async () => {
    const ingredients = [
      { name: 'flour', quantity: '2', unit: 'cups' },
    ];
    
    // Mock error response
    mockGenerateInstacartUrl.mockRejectedValue(new Error('API error'));
    
    wrapper = mount(InstacartButton, {
      props: {
        ingredients,
      }
    });
    
    // Click the button
    await wrapper.find('button').trigger('click');
    
    // Verify loading state was reset
    expect(wrapper.vm.isGenerating).toBe(false);
    
    // Check error was logged
    expect(console.error).toHaveBeenCalled();
    
    // Check error toast was shown
    expect(mockToast.add).toHaveBeenCalledWith({
      title: 'recipe.instacart.error.title',
      description: 'recipe.instacart.error.description',
      color: 'error',
    });
    
    // Window.open should not be called
    expect(mockWindowOpen).not.toHaveBeenCalled();
  });

  it('handles null/undefined URL in response', async () => {
    const ingredients = [
      { name: 'flour', quantity: '2', unit: 'cups' },
    ];
    
    // Mock bad response
    mockGenerateInstacartUrl.mockResolvedValue({
      url: null,
      ingredients: ingredients.length,
    });
    
    wrapper = mount(InstacartButton, {
      props: {
        ingredients,
      }
    });
    
    // Click the button
    await wrapper.find('button').trigger('click');
    
    // Error should be thrown and caught internally
    expect(console.error).toHaveBeenCalled();
    
    // Error toast should be shown
    expect(mockToast.add).toHaveBeenCalledWith({
      title: 'recipe.instacart.error.title',
      description: 'recipe.instacart.error.description',
      color: 'error',
    });
  });

  it('correctly formats complex ingredient data', async () => {
    // Test with more complex input types that need normalization
    const ingredients = [
      { name: 'flour', quantity: 2, unit: { value: 'cups', label: 'Cups' } },
      { name: ' Sugar ', quantity: '', unit: null },
      { name: 'salt', quantity: 0, unit: undefined },
    ];
    
    mockGenerateInstacartUrl.mockResolvedValue({
      url: 'https://instacart.com/cart/123',
      ingredients: 3,
    });
    
    wrapper = mount(InstacartButton, {
      props: {
        ingredients,
      }
    });
    
    // Click the button
    await wrapper.find('button').trigger('click');
    
    // Verify function was called with normalized ingredients
    expect(mockGenerateInstacartUrl).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'flour', quantity: '2', unit: 'cups' }),
        expect.objectContaining({ name: 'sugar', quantity: '', unit: '' }),
        // Note: In the component code it retains 0 as a string, not converting it to empty string 
        // when quantityStr !== '0' is checked
      ]),
      expect.anything()
    );
  });

  it('shows loading spinner while generating URL', async () => {
    // Delay the resolution to ensure we can test the loading state
    mockGenerateInstacartUrl.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          url: 'https://instacart.com/cart/123',
          ingredients: 1,
        });
      }, 10);
    }));
    
    wrapper = mount(InstacartButton, {
      props: {
        ingredients: [{ name: 'flour', quantity: '2', unit: 'cups' }],
      }
    });
    
    // Click the button
    const button = wrapper.find('button');
    await button.trigger('click');
    
    // Should be in loading state
    expect(wrapper.vm.isGenerating).toBe(true);
    
    // Loading spinner should be visible and text should be updated
    expect(wrapper.find('svg').exists()).toBe(true);
    expect(wrapper.find('span.font-medium').text()).toBe('recipe.instacart.loading');
    
    // Wait for resolution
    await new Promise(resolve => setTimeout(resolve, 20));
    await wrapper.vm.$nextTick();
    
    // Loading state should be cleared
    expect(wrapper.vm.isGenerating).toBe(false);
    expect(wrapper.find('button img').exists()).toBe(true);
    expect(wrapper.find('span.font-medium').text()).toBe('recipe.instacart.button');
  });
});

// No need to restore console.error since we're using vi.fn()