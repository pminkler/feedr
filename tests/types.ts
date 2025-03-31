import { Ref } from 'vue';

// Type definitions for mocked composables
export interface AuthComposable {
  currentUser: Ref<{ username: string } | null>;
}

export interface RecipeTag {
  id: string;
  name: string;
}

export interface Recipe {
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
  recipesState: Ref<Record<string, Record<string, any>>>;
  myRecipesState: Ref<any[]>;
  isMyRecipesSynced: Ref<boolean>;
  recipeTags?: Ref<RecipeTag[]>;
  updateRecipe: (recipeId: string, updateData: Record<string, any>) => Promise<any>;
  createRecipe: (recipeData: Record<string, any>) => Promise<any>;
  getRecipeById: (id: string) => Promise<any>;
  getMyRecipes: () => Promise<any[]>;
  subscribeToMyRecipes: () => any;
  scaleIngredients: (
    ingredients: { name: string; quantity: string; unit: string }[],
    multiplier: number
  ) => { name: string; quantity: string; unit: string }[];
  copyRecipe: (recipeId: string) => Promise<any>;
  generateInstacartUrl: (
    ingredients: { name: string; quantity?: string; unit?: string }[],
    recipeData?: { title?: string; instructions?: string[]; imageUrl?: string }
  ) => Promise<any>;
  deleteAllRecipes: () => Promise<boolean>;
}
