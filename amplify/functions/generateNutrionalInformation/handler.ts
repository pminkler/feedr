// functions/generateNutritionalInformation/index.ts

import type { Handler } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { OpenAI } from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { env } from '$amplify/env/generateNutritionalInformation';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import type { Schema } from '../../data/resource';

// Configure Amplify for Data access
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'generate-nutritional-information-handler',
});

// Define the Zod schema for nutritional information
const NutritionalInformationSchema = z.object({
  calories: z.string(),
  fat: z.string(),
  carbs: z.string(),
  protein: z.string(),
});

// Our handler expects an event that contains the output from generateRecipe.
// That output should include an "id" and "processed_recipe" with fields such as ingredients and servings.
export const handler: Handler = async (event) => {
  logger.info(`Received event: ${JSON.stringify(event)}`);

  const id = event.id || event.result?.Payload?.id;
  const processed_recipe = event.processed_recipe || event.result?.Payload?.processed_recipe;

  if (!processed_recipe) {
    throw new Error("Missing 'processed_recipe' in input.");
  }
  if (!id) {
    logger.error("Missing 'id' in input.");
    throw new Error("Missing 'id' in input.");
  }

  const { ingredients, servings } = processed_recipe;
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    logger.error('No ingredients found in processed_recipe.');
    throw new Error('No ingredients provided.');
  }
  if (!servings) {
    logger.error("Missing 'servings' in processed_recipe.");
    throw new Error("Missing 'servings' in processed_recipe.");
  }

  logger.info(`Generating nutritional information for recipe ID: ${id}`);

  // Convert ingredients into a human-friendly string.
  // For example, "2 cups flour, 1 egg, 0.5 cup sugar" etc.
  const ingredientsText = ingredients
    .map((ingredient: any) => {
      return `${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`;
    })
    .join(', ');

  // Build a prompt for OpenAI. Adjust the wording as necessary.
  const prompt = `Given the following ingredients: ${ingredientsText}, and that the recipe serves ${servings}, provide the nutritional information per serving as JSON. The JSON should have the keys: "calories", "fat", "carbs", and "protein" (all as string values).`;

  try {
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    // Call OpenAI's chat completions endpoint with the prompt.
    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that provides nutritional information based on given ingredients and serving size.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: zodResponseFormat(NutritionalInformationSchema, 'nutritional_information'),
    });

    const nutritionalInfo = completion.choices[0].message.parsed;
    logger.info(`Received nutritional information: ${JSON.stringify(nutritionalInfo)}`);

    // Update the recipe record with the nutritional information.
    try {
      const response = await client.models.Recipe.update({
        id,
        nutritionalInformation: { ...nutritionalInfo, status: 'SUCCESS' },
      });
      logger.info(`Updated recipe with nutritional info: ${JSON.stringify(response)}`);
    } catch (updateError) {
      logger.error(`Error updating recipe with nutritional info: ${updateError}`);
      throw new Error('Failed to update recipe with nutritional information.');
    }

    return {
      id,
      nutritional_information: nutritionalInfo,
    };
  } catch (error) {
    logger.error(`Error generating nutritional information: ${error}`);
    throw new Error('Failed to generate nutritional information.');
  }
};
