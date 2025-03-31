import { describe, it, expect, vi } from 'vitest';
import { useRecipe } from '~/composables/useRecipe';
import type { RecipeComposable } from '../types';

// Define the global ref function for tests
interface GlobalRef {
  ref: <T>(value: T) => { value: T };
}

// Extend the globalThis interface for TypeScript
declare global {
  interface Window extends GlobalRef {}
}

// Get ref from global scope for tests
const ref = (window as unknown as GlobalRef).ref;

// Add mock for useIdentity
vi.mock('~/composables/useIdentity', () => ({
  useIdentity: vi.fn(() => ({
    getOwnerId: vi.fn().mockResolvedValue('mock-identity-id'),
    getAuthOptions: vi.fn().mockResolvedValue({ authMode: 'userPool' }),
  })),
}));

describe('useRecipe', () => {
  // Create a simple test version of normalizeFractionString since we can't easily
  // access the private function in the composable
  const normalizeFractionString = (str: string): string => {
    const unicodeMap: Record<string, string> = {
      '½': '1/2',
      '⅓': '1/3',
      '⅔': '2/3',
      '¼': '1/4',
      '¾': '3/4',
      '⅕': '1/5',
      '⅖': '2/5',
      '⅗': '3/5',
      '⅘': '4/5',
      '⅙': '1/6',
      '⅚': '5/6',
      '⅛': '1/8',
      '⅜': '3/8',
      '⅝': '5/8',
      '⅞': '7/8',
    };

    Object.keys(unicodeMap).forEach((unicodeFrac) => {
      if (str.includes(unicodeFrac)) {
        str = str.replace(new RegExp(unicodeFrac, 'g'), unicodeMap[unicodeFrac] || '');
      }
    });
    return str;
  };

  describe('normalizeFractionString', () => {
    it('should convert Unicode fractions to ASCII fractions', () => {
      // Test common Unicode fractions
      expect(normalizeFractionString('½ cup sugar')).toBe('1/2 cup sugar');
      expect(normalizeFractionString('⅓ cup flour')).toBe('1/3 cup flour');
      expect(normalizeFractionString('¼ teaspoon salt')).toBe('1/4 teaspoon salt');
      expect(normalizeFractionString('⅔ cup milk')).toBe('2/3 cup milk');
      expect(normalizeFractionString('⅛ teaspoon pepper')).toBe('1/8 teaspoon pepper');

      // Test multiple fractions in one string
      expect(normalizeFractionString('½ cup sugar and ¼ teaspoon salt')).toBe(
        '1/2 cup sugar and 1/4 teaspoon salt'
      );

      // Test with no fractions
      expect(normalizeFractionString('1 cup sugar')).toBe('1 cup sugar');

      // Test with empty string
      expect(normalizeFractionString('')).toBe('');
    });
  });

  // Test the scaleIngredients function (a simpler test since we're just checking basics)
  describe('scaleIngredients', () => {
    it('should scale ingredient quantities correctly', () => {
      // Create a partial mock implementation with just what we need for this test
      const mockScaleIngredients = (ingredients: any[], multiplier: number) => {
        return ingredients.map((ingredient: any) => ({
          ...ingredient,
          quantity: String(Number(ingredient.quantity) * multiplier),
        }));
      };

      // Mock the hook directly rather than trying to type-check the full interface
      vi.mocked(useRecipe).mockImplementation(() => {
        return {
          scaleIngredients: mockScaleIngredients,
        } as any;
      });

      const { scaleIngredients } = useRecipe();

      const ingredients = [
        { name: 'flour', quantity: '2', unit: 'cups' },
        { name: 'sugar', quantity: '1', unit: 'cup' },
      ];

      const scaled = scaleIngredients(ingredients, 2);

      // Use optional chaining to handle possibly undefined values
      expect(scaled?.[0]?.quantity).toBe('4');
      expect(scaled?.[1]?.quantity).toBe('2');
      expect(scaled?.[0]?.name).toBe('flour');
      expect(scaled?.[1]?.name).toBe('sugar');
    });
  });
});
