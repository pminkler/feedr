import {
  type ClientSchema,
  a,
  defineData,
  defineFunction,
} from "@aws-amplify/backend";
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

    RecipeTag: a.customType({
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
        owners: a.string().array(),
        tags: a.ref("RecipeTag").array(),
        mealPlanRecipes: a.hasMany("MealPlanRecipe", "recipeId"),
        createdBy: a.string(), // To store Cognito identity ID for guest users
      })
      .authorization((allow) => [
        allow.guest().to(["read", "create"]),
        allow.authenticated().to(["read", "create"]),
        allow.custom().to(["update", "delete"]),
      ]),

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
        recipeId: a.id().required(),
        recipe: a.belongsTo("Recipe", "recipeId"),
        config: a.ref("MealPlanRecipeConfig").required(),
        owners: a.string().array(),
        createdBy: a.string(),
      })
      .authorization((allow) => [
        // Create access for all users
        allow.guest().to(["create"]),
        allow.authenticated().to(["create"]),
        // Custom owners-based authorization for protected operations
        allow.custom().to(["read", "update", "delete"]),
      ]),

    MealPlan: a
      .model({
        id: a.id(),
        name: a.string().required(),
        startDate: a.string().required(),
        endDate: a.string().required(),
        mealPlanRecipes: a.hasMany("MealPlanRecipe", "mealPlanId"),
        createdAt: a.string(),
        updatedAt: a.string(),
        notes: a.string(),
        owners: a.string().array(),
        createdBy: a.string(), // To store Cognito identity ID for guest users
      })
      .authorization((allow) => [
        // Create access for all users
        allow.guest().to(["create"]),
        allow.authenticated().to(["create"]),
        // Custom owners-based authorization for protected operations
        // (especially important for read operations to be limited to owners)
        allow.custom().to(["read", "update", "delete"]),
      ]),
  })
  .authorization((allow) => [
    // Lambda functions for data processing
    allow.resource(generateRecipe),
    allow.resource(generateNutritionalInformation),
    allow.resource(generateInstacartUrl),
    allow.resource(markFailure),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "lambda",
    // Configure the Custom Owners Authorizer for ownership-based access control
    lambdaAuthorizationMode: {
      function: defineFunction({
        entry: "./custom-owners-authorizer.ts",
      }),
      // Cache tokens for 5 minutes
      timeToLiveInSeconds: 300,
    },
  },
});
