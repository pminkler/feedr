export type Nullable<T> = T | null;

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
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  pictureSubmissionUUID: string;
  owners?: string[];
  tags?: RecipeTag[];
  createdBy?: string;
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
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  calories: string;
  fat: string;
  carbs: string;
  protein: string;
};

export type RecipeTag = {
  id?: string;
  name: string;
};

export interface TagItem {
  id: string;
  name: string;
}

// UI Components types
export interface SelectItem {
  label: string;
  value: string;
}

export interface FormIngredient {
  name: string;
  quantity: number | string;
  unit: SelectItem;
  stepMapping?: number[];
  _originalQuantity?: string;
  _originalUnit?: string;
}

export type TimeUnit = 'minutes' | 'hours';

export interface AuthFormField {
  name: string;
  type: 'text' | 'password' | 'checkbox' | 'select';
  label: string;
  placeholder: string;
  help?: string;
  defaultValue?: unknown;
}
