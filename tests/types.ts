import type { Ref } from 'vue';

// Type definitions for mocked composables
export interface AuthComposable {
  currentUser: Ref<{ username: string } | null>;
}

export interface RecipeTag {
  id: string;
  name: string;
}

export interface Recipe extends Record<string, unknown> {
  id: string;
  title: string;
  description?: string;
  ingredients?: {
    name: string;
    quantity: string;
    unit: string;
  }[];
  instructions?: string[];
  owners?: string[];
  tags?: RecipeTag[];
}

export interface RecipeComposable {
  recipesState: Ref<Record<string, Record<string, unknown>>>;
  myRecipesState: Ref<Recipe[]>;
  isMyRecipesSynced: Ref<boolean>;
  recipeTags?: Ref<RecipeTag[]>;
  updateRecipe: (recipeId: string, updateData: Record<string, unknown>) => Promise<Recipe>;
  createRecipe: (recipeData: Record<string, unknown>) => Promise<Recipe>;
  getRecipeById: (id: string) => Promise<Recipe>;
  getMyRecipes: () => Promise<Recipe[]>;
  subscribeToMyRecipes: () => void;
  unsubscribeFromMyRecipes: () => void;
  scaleIngredients: (
    ingredients: { name: string; quantity: string; unit: string }[],
    multiplier: number
  ) => { name: string; quantity: string; unit: string }[];
  copyRecipe: (recipeId: string) => Promise<Recipe>;
  generateInstacartUrl: (
    ingredients: { name: string; quantity?: string; unit?: string }[],
    recipeData?: { title?: string; instructions?: string[]; imageUrl?: string }
  ) => Promise<Record<string, unknown>>;
  deleteAllRecipes: () => Promise<boolean>;
}
