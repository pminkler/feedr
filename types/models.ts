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
  tags: SavedRecipeTag[];
  createdAt: string;
};

export type SavedRecipeTag = {
  id: string;
  name: string;
  color: string;
};
