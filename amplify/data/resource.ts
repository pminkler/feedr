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
        instacart: a.ref("InstacartInfo"),
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
