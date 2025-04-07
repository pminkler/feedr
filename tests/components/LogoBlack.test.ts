import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import LogoBlack from '~/components/LogoBlack.vue';

describe('LogoBlack', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    wrapper = mount(LogoBlack);
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it('renders the svg element', () => {
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('has the correct style attributes', () => {
    const svg = wrapper.find('svg');
    const style = svg.attributes('style');
    expect(style).toContain('height: 100%');
    expect(style).toContain('width: auto');
    expect(style).toContain('display: block');
  });

  it('has the correct viewBox', () => {
    const svg = wrapper.find('svg');
    expect(svg.attributes('viewBox')).toBe('-168.3673469387755 0 3153.0612244897957 968.505661488815');
  });

  it('has the black color fill for logo elements', () => {
    const logoIcon = wrapper.find('#SvgjsG2880');
    const logoText = wrapper.find('#SvgjsG2881');
    
    expect(logoIcon.attributes('fill')).toBe('#000');
    expect(logoText.attributes('fill')).toBe('#000');
  });
});