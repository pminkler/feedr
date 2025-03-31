import { vi } from 'vitest';

// Define a simple reactive ref implementation for testing
function createRef<T>(initialValue: T) {
  return { value: initialValue };
}

// Mock #app module for Nuxt composables
vi.mock('#app', () => ({
  useState: vi.fn((key, initializer) => {
    return typeof initializer === 'function' ? createRef(initializer()) : createRef(initializer);
  }),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useLocalePath: vi.fn(() => (path: string) => path),
}));

// Also export the ref function for use in tests
globalThis.ref = createRef;

// Mock Nuxt UI components
vi.mock('#components', () => ({
  UHeader: {
    template: '<div class="u-header"><slot name="left" /><slot /><slot name="right" /></div>',
  },
  UNavigationMenu: {
    props: ['items'],
    template: '<div class="navigation-menu">{{ items.length }}</div>',
  },
  ULink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
  UButton: {
    props: ['color', 'variant'],
    template: '<button :class="[color, variant]"><slot /></button>',
  },
}));

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: vi.fn(() => ({
    t: vi.fn((key) => {
      const translations = {
        'header.signUp': 'Sign Up',
        'header.signIn': 'Sign In',
        'header.signOut': 'Sign Out',
        'header.myRecipes': 'My Recipes',
      };
      return translations[key] || key;
    }),
  })),
}));

// Mock composables
vi.mock('~/composables/useAuth', () => ({
  useAuth: vi.fn(() => ({
    currentUser: { value: null },
  })),
}));

vi.mock('~/composables/useRecipe', () => ({
  useRecipe: vi.fn(() => ({
    myRecipesState: { value: [] },
    isMyRecipesSynced: { value: true },
    getMyRecipes: vi.fn().mockResolvedValue([]),
    subscribeToMyRecipes: vi.fn().mockReturnValue({}),
    scaleIngredients: vi.fn((ingredients, multiplier) => {
      return ingredients.map((ingredient) => ({
        ...ingredient,
        quantity: String(Number(ingredient.quantity) * multiplier),
      }));
    }),
  })),
}));

// Mock aws-amplify
vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(() => ({ identityId: 'mock-identity-id' })),
  signOut: vi.fn(),
}));

vi.mock('aws-amplify/data', () => ({
  generateClient: vi.fn(() => ({
    models: {
      Recipe: {
        create: vi.fn(),
        get: vi.fn(),
        list: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  })),
}));

vi.mock('aws-amplify/api', () => ({
  post: vi.fn(),
}));

// Mock other dependencies
vi.mock('fraction.js', () => {
  return {
    default: class Fraction {
      constructor(value: string | number) {
        this.value = value;
      }
      value: string | number;

      mul(n: number) {
        return new Fraction(Number(this.value) * n);
      }

      toFraction(_mixed = false) {
        return String(this.value);
      }
    },
  };
});
