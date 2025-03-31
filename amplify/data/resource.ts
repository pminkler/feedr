import { type ClientSchema, a, defineData, defineFunction } from '@aws-amplify/backend';
import { generateRecipe } from '../functions/generateRecipe/resource';
import { markFailure } from '../functions/markFailure/resource';
import { generateNutritionalInformation } from '../functions/generateNutrionalInformation/resource';
import { generateInstacartUrl } from '../functions/generateInstacartUrl/resource';
import { sendFeedbackEmail } from '../functions/sendFeedbackEmail/resource';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/
const schema = a
  .schema({
    NutritionalInformation: a.customType({
      status: a.enum(['PENDING', 'SUCCESS', 'FAILED']),
      calories: a.string(),
      fat: a.string(),
      carbs: a.string(),
      protein: a.string(),
    }),

    FeedbackType: a.enum([
      'FEATURE_REQUEST',
      'BUG_REPORT',
      'GENERAL_FEEDBACK',
      'QUESTION',
      'SUGGESTION',
      'OTHER',
    ]),

    Feedback: a
      .model({
        id: a.id(),
        email: a.string(),
        message: a.string(),
        type: a.ref('FeedbackType'),
      })
      .authorization((allow) => [allow.guest(), allow.authenticated()]),

    Ingredient: a.customType({
      name: a.string(),
      quantity: a.string(),
      unit: a.string(),
      stepMapping: a.integer().array(),
    }),

    RecipeTag: a.customType({
      name: a.string(),
    }),

    Recipe: a
      .model({
        id: a.id(),
        ingredients: a.ref('Ingredient').array(),
        nutritionalInformation: a.ref('NutritionalInformation'),
        instructions: a.string().array(),
        url: a.string(),
        title: a.string(),
        description: a.string(),
        prep_time: a.string(),
        cook_time: a.string(),
        servings: a.string(),
        imageUrl: a.string(),
        status: a.enum(['PENDING', 'SUCCESS', 'FAILED']),
        pictureSubmissionUUID: a.string(),
        language: a.enum(['en', 'es', 'fr']),
        owners: a.string().array(),
        tags: a.ref('RecipeTag').array(),
        createdBy: a.string(), // To store Cognito identity ID for guest users
      })
      .authorization((allow) => [
        allow.guest().to(['read', 'create']),
        allow.authenticated().to(['read', 'create']),
        allow.custom().to(['update', 'delete', 'read']),
      ]),
  })
  .authorization((allow) => [
    // Lambda functions for data processing
    allow.resource(generateRecipe),
    allow.resource(generateNutritionalInformation),
    allow.resource(markFailure),
    allow.resource(generateInstacartUrl),
    allow.resource(sendFeedbackEmail),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'lambda',
    // Configure the Custom Owners Authorizer for ownership-based access control
    lambdaAuthorizationMode: {
      function: defineFunction({
        entry: './custom-owners-authorizer.ts',
      }),
      // Cache tokens for 5 minutes
      timeToLiveInSeconds: 300,
    },
  },
});
