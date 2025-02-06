import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { generateRecipe } from "../functions/generateRecipe/resource";
import { markFailure } from "../functions/markFailure/resource";
import { generateNutritionalInformation } from "../functions/generateNutrionalInformation/resource";

/*=============================================================================
  Define your schema with relationships and authorization.
=============================================================================*/
const schema = a
  .schema({
    // Custom type for nutritional information.
    NutritionalInformation: a.customType({
      status: a.enum(["PENDING", "SUCCESS", "FAILED"]),
      calories: a.string(),
      fat: a.string(),
      carbs: a.string(),
      protein: a.string(),
    }),

    // Feedback model – now accessible to both guests and authenticated users.
    Feedback: a
      .model({
        id: a.id(),
        email: a.string(),
        message: a.string(),
      })
      .authorization((allow) => [allow.guest(), allow.authenticated()]),

    // Ingredient is a custom type.
    Ingredient: a.customType({
      name: a.string(),
      quantity: a.string(),
      unit: a.string(),
      stepMapping: a.integer().array(),
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
        tags: a.string().array(),
        imageUrl: a.string(),
        status: a.enum(["PENDING", "SUCCESS", "FAILED"]),
        pictureSubmissionUUID: a.string(),
        language: a.enum(["en", "es", "fr"]),
        savedRecipes: a.hasMany("SavedRecipe", "recipeId"),
      })
      .authorization((allow) => [allow.guest(), allow.authenticated()]),

    SavedRecipe: a
      .model({
        id: a.id(),
        recipeId: a.id().required(),
        recipe: a.belongsTo("Recipe", "recipeId"),
      })
      .authorization((allow) => [allow.owner()]),
  })
  .authorization((allow) => [
    // Allow resource-level access to functions.
    allow.resource(generateRecipe),
    allow.resource(generateNutritionalInformation),
    allow.resource(markFailure),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "iam",
  },
});
