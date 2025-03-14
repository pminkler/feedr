export type Recipe = {
  id: string;
  ingredients: Ingredient[];
  nutritionalInformation: NutritionalInformation;
  instructions: string[];
  url: string;
  title: string;
  description: string;
  prep_time: string;
  cook_time: string;
  servings: string;
  imageUrl: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  pictureSubmissionUUID: string;
};

export type Ingredient = {
  name: string;
  quantity: string;
  unit: string;
  stepMapping: number[];
};

export type NutritionalInformation = {
  status: "PENDING" | "SUCCESS" | "FAILED";
  calories: string;
  fat: string;
  carbs: string;
  protein: string;
};

export type SavedRecipe = {
  id: string;
  recipeId: string;
  title: string;
  description: string;
  prep_time: string;
  cook_time: string;
  servings: string;
  imageUrl: string;
  ingredients: Ingredient[];
  instructions: string[];
  nutritionalInformation: NutritionalInformation;
  tags: SavedRecipeTag[];
  createdAt: string;
};

export type SavedRecipeTag = {
  id: string;
  name: string;
  color: string;
};

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'OTHER';

export type MealPlanRecipeConfig = {
  servingSize: number;
  dayAssignment: string; // ISO date string format (YYYY-MM-DD)
  mealType?: MealType;
  notes?: string;
};

export type MealPlanRecipe = {
  id: string;
  mealPlanId: string;
  savedRecipeId: string;
  savedRecipe?: SavedRecipe;
  config: MealPlanRecipeConfig;
};

export type MealPlan = {
  id: string;
  name: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  mealPlanRecipes: MealPlanRecipe[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
};