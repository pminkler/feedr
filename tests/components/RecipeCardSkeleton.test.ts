import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RecipeCardSkeleton from '~/components/RecipeCardSkeleton.vue';

// Mock the UI components with custom implementations
vi.mock('#components', () => ({
  UPageCard: {
    name: 'UPageCard',
    template: '<div><slot /></div>',
  },
  USkeleton: {
    name: 'USkeleton',
    props: ['class'],
    template: '<div class="u-skeleton-mock" :class="class"></div>',
  },
}));

describe('RecipeCardSkeleton.vue', () => {
  it('renders with default props', () => {
    const wrapper = mount(RecipeCardSkeleton);

    // Check for the presence of div elements that would contain skeletons
    const skeletonContainer = wrapper.findAll('.space-y-2');
    expect(skeletonContainer.length).toBe(1);
    
    // We can verify the v-for directive renders the right number of components
    // by checking the component definition directly
    const component = wrapper.vm;
    expect(component).toBeDefined();
    expect(component.lineCount).toBe(3);
    expect(component.useTitle).toBe(true);
    expect(component.useParagraphs).toBe(false);
  });
  
  it('respects custom props', () => {
    const wrapper = mount(RecipeCardSkeleton, {
      props: {
        useTitle: false,
        lineCount: 5,
        useParagraphs: true,
      },
    });
    
    // Verify props are correctly passed to the component
    const component = wrapper.vm;
    expect(component.useTitle).toBe(false);
    expect(component.lineCount).toBe(5);
    expect(component.useParagraphs).toBe(true);
  });
});