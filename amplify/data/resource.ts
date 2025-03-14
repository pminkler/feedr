import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { generateRecipe } from "../functions/generateRecipe/resource";
import { markFailure } from "../functions/markFailure/resource";
import { generateNutritionalInformation } from "../functions/generateNutrionalInformation/resource";
import { generateInstacartUrl } from "../functions/generateInstacartUrl/resource";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/
const schema = a
  .schema({
    NutritionalInformation: a.customType({
      status: a.enum(["PENDING", "SUCCESS", "FAILED"]),
      calories: a.string(),
      fat: a.string(),
      carbs: a.string(),
      protein: a.string(),
    }),

    Feedback: a
      .model({
        id: a.id(),
        email: a.string(),
        message: a.string(),
      })
      .authorization((allow) => [allow.guest(), allow.authenticated()]),

    Ingredient: a.customType({
      name: a.string(),
      quantity: a.string(),
      unit: a.string(),
      stepMapping: a.integer().array(),
    }),

    InstacartInfo: a.customType({
      status: a.enum(["PENDING", "SUCCESS", "FAILED"]),
      url: a.string(),
    }),

    SavedRecipeTag: a.customType({
      name: a.string(),
      color: a.string(),
    }),

    Recipe: a
      .model({
        id: a.id(),
        ingredients: a.ref("Ingredient").array(),
        nutritionalInformation: a.ref("NutritionalInformation"),
        instructions: a.string().array(),
        url: a.string(),
        title: a.string(),
        description: a.string(),
        prep_time: a.string(),
        cook_time: a.string(),
        servings: a.string(),
        imageUrl: a.string(),
        status: a.enum(["PENDING", "SUCCESS", "FAILED"]),
        pictureSubmissionUUID: a.string(),
        language: a.enum(["en", "es", "fr"]),
        instacart: a.ref("InstacartInfo"),
      })
      .authorization((allow) => [allow.guest(), allow.authenticated()]),

    SavedRecipe: a
      .model({
        id: a.id(),
        recipeId: a.id().required(),
        title: a.string(),
        description: a.string(),
        prep_time: a.string(),
        cook_time: a.string(),
        servings: a.string(),
        imageUrl: a.string(),
        ingredients: a.ref("Ingredient").array(),
        instructions: a.string().array(),
        nutritionalInformation: a.ref("NutritionalInformation"),
        tags: a.ref("SavedRecipeTag").array(),
        mealPlanRecipes: a.hasMany("MealPlanRecipe", "savedRecipeId"),
      })
      .authorization((allow) => [allow.owner()]),
      
    MealPlanRecipeConfig: a.customType({
      servingSize: a.integer().required(),
      dayAssignment: a.string(), // ISO date string format (YYYY-MM-DD)
      mealType: a.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "OTHER"]),
      notes: a.string(),
    }),
    
    MealPlanRecipe: a
      .model({
        id: a.id(),
        mealPlanId: a.id().required(),
        mealPlan: a.belongsTo("MealPlan", "mealPlanId"),
        savedRecipeId: a.id().required(),
        savedRecipe: a.belongsTo("SavedRecipe", "savedRecipeId"),
        config: a.ref("MealPlanRecipeConfig").required(),
      })
      .authorization((allow) => [allow.owner()]),
      
    MealPlan: a
      .model({
        id: a.id(),
        name: a.string().required(),
        startDate: a.string().required(), // ISO date string
        endDate: a.string().required(),   // ISO date string
        mealPlanRecipes: a.hasMany("MealPlanRecipe", "mealPlanId"),
        createdAt: a.string(),
        updatedAt: a.string(),
        notes: a.string(),
      })
      .authorization((allow) => [allow.owner()]),
  })
  .authorization((allow) => [
    allow.resource(generateRecipe),
    allow.resource(generateNutritionalInformation),
    allow.resource(generateInstacartUrl),
    allow.resource(markFailure),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "iam",
  },
});