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
  owners?: string[];
  tags?: RecipeTag[];
  createdAt?: string;
  updatedAt?: string;
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


export type RecipeTag = {
  id: string;
  name: string;
  color: string;
};

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'OTHER';

// A folder/collection of recipes
export type MealPlan = {
  id: string;
  name: string;
  color: string; // Hex color code for visual distinction
  isActive: boolean; // Whether this plan is currently visible in the calendar
  createdAt: string;
  updatedAt: string;
  notes?: string;
  owners?: string[];
  createdBy?: string;
};

// An assignment of a recipe to a specific date in a specific meal plan
export type MealAssignment = {
  id: string;
  mealPlanId: string;
  mealPlan?: MealPlan;
  recipeId: string;
  recipe?: Recipe;
  date: string; // ISO date string (YYYY-MM-DD)
  mealType: MealType;
  servingSize: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  owners?: string[];
  createdBy?: string;
};