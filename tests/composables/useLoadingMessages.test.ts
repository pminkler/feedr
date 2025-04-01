import { describe, it, expect, vi } from 'vitest';
import { useLoadingMessages } from '~/composables/useLoadingMessages';

describe('useLoadingMessages', () => {
  it('should export getRandomMessage function', () => {
    const { getRandomMessage } = useLoadingMessages();
    expect(typeof getRandomMessage).toBe('function');
  });

  it('should return a string message', () => {
    const { getRandomMessage } = useLoadingMessages();
    const randomMessage = getRandomMessage();
    
    // Make sure we have a string message
    expect(typeof randomMessage).toBe('string');
    
    if (randomMessage) {
      expect(randomMessage.length).toBeGreaterThan(0);
    }
  });

  it('should return random messages from the list', () => {
    // Mock Math.random to return specific values
    const mockMath = Object.create(global.Math);
    mockMath.random = vi.fn();
    global.Math = mockMath;

    const { getRandomMessage } = useLoadingMessages();
    
    // Test first message
    mockMath.random.mockReturnValueOnce(0);
    expect(getRandomMessage()).toBe('Simmering your recipe...');
    
    // Test middle message
    mockMath.random.mockReturnValueOnce(0.5);
    const middleMessage = getRandomMessage();
    expect(middleMessage).toBeDefined();
    expect(typeof middleMessage).toBe('string');
    
    // Test last message
    mockMath.random.mockReturnValueOnce(0.99);
    const lastMessage = getRandomMessage();
    expect(lastMessage).toBeDefined();
    expect(typeof lastMessage).toBe('string');
  });
});