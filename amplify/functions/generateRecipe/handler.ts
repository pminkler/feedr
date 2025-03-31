// functions/generateRecipe/index.ts

import type { Handler } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { OpenAI } from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { env } from '$amplify/env/generateRecipe';
import type { Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';

// Configure Amplify for Data access
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'generate-recipe-handler',
});

// Define Zod schema for recipe extraction
const Ingredient = z.object({
  name: z.string(),
  quantity: z.string(),
  unit: z.string(),
  stepMapping: z.array(z.number()).optional(),
});

const RecipeExtraction = z.object({
  title: z.string(),
  ingredients: z.array(Ingredient),
  instructions: z.array(z.string()),
  prep_time: z.string(),
  cook_time: z.string(),
  servings: z.string(),
});

export const handler: Handler = async (event) => {
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  logger.info(`Received event: ${JSON.stringify(event)}`);

  // Expecting the event to have an 'id', 'extractedText', and a 'language'
  const { id, extractedText, language } = event;
  if (!id) {
    logger.error("Missing 'id' in input.");
    throw new Error("Missing 'id' in input.");
  }
  if (!extractedText) {
    logger.error("Missing 'extractedText' in input.");
    throw new Error("Missing 'extractedText' in input.");
  }

  // Determine the target language (default to English if not provided)
  const targetLanguage = typeof language === 'string' ? language : 'en';

  // Unwrap extractedText in case it is nested
  let textForOpenAI: string = '';
  if (typeof extractedText === 'string') {
    textForOpenAI = extractedText;
  } else if (typeof extractedText === 'object') {
    // Check for a Payload wrapper
    if ('Payload' in extractedText) {
      const payload = extractedText.Payload;
      if (typeof payload === 'string') {
        textForOpenAI = payload;
      } else if (typeof payload === 'object' && payload.extractedText) {
        textForOpenAI = payload.extractedText;
      }
    } else if (extractedText.extractedText) {
      textForOpenAI = extractedText.extractedText;
    }
  }

  if (!textForOpenAI || typeof textForOpenAI !== 'string') {
    logger.error("Invalid format for 'extractedText'");
    throw new Error("Invalid format for 'extractedText'");
  }

  // Log a snippet of the extracted text for debugging
  logger.info(`Unwrapped textForOpenAI (first 100 chars): ${textForOpenAI.substring(0, 100)}...`);

  // Validate that the text is sufficiently long to contain a recipe
  const MIN_TEXT_LENGTH = 100; // adjust threshold as needed
  if (textForOpenAI.trim().length < MIN_TEXT_LENGTH) {
    logger.error(
      `Extracted text is too short for a valid recipe: ${textForOpenAI.trim().length} characters.`
    );
    throw new Error('Insufficient content to generate a recipe.');
  }

  logger.info(`Generating recipe for ID: ${id} in language: ${targetLanguage}`);

  // Build a comprehensive system prompt with guidelines for units and formatting
  const systemMessage = `You are a recipe extraction assistant. Your task is to read raw recipe text and extract structured recipe data in JSON format. The JSON must strictly follow this schema:
{
  "title": "string",
  "ingredients": [
    {
      "name": "string",
      "quantity": "string",
      "unit": "string",
      "stepMapping": [number, ...] // optional; include if the ingredient is tied to specific steps
    }
  ],
  "instructions": ["string", ...],
  "prep_time": "string",
  "cook_time": "string",
  "servings": "string"
}

Important Formatting Guidelines for Ingredients:
1. Quantity:
   - Convert fractional quantities (e.g., "1 1/2") into a decimal string (e.g., "1.5").
   - The quantity must be provided as a string that can be parsed as a number.
2. Unit of Measurement:
   - Use standardized unit names for consistency.
   - For liquid and common measurements, use the following preferred singular forms:
       • "cup" (not "cups" or "c")
       • "tablespoon" (not "tablespoons", "tb", or "tbs")
       • "teaspoon" (not "teaspoons", "ts", or "tspn")
   - For countable items, use "each".
   - For weights, use singular forms such as "gram" or "kilogram".
3. Step Mapping:
   - If an ingredient is used in specific steps, include a "stepMapping" array with the 1-based indices of the steps.
   - If an ingredient is used generally or its usage is not tied to specific steps, omit the "stepMapping" field.
4. Language:
   - Return all output in ${targetLanguage}.
   
Your output must be strictly in JSON format with no additional commentary.`;

  try {
    // Call OpenAI using the extracted text and the system prompt
    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: textForOpenAI,
        },
      ],
      response_format: zodResponseFormat(RecipeExtraction, 'recipe_extraction'),
    });

    const structuredRecipe = completion.choices[0]?.message?.parsed;
    logger.info(`Structured Recipe: ${JSON.stringify(structuredRecipe)}`);

    // Update the recipe record in the database
    try {
      const response = await client.models.Recipe.update({
        id,
        status: 'SUCCESS',
        title: structuredRecipe?.title,
        ingredients: structuredRecipe?.ingredients,
        prep_time: structuredRecipe?.prep_time ?? '',
        cook_time: structuredRecipe?.cook_time ?? '',
        servings: structuredRecipe?.servings ?? '',
        instructions: structuredRecipe?.instructions ?? [],
        description: '',
        imageUrl: '',
      });
      logger.info(`Recipe update response: ${JSON.stringify(response)}`);
    } catch (updateError) {
      logger.error(`Error updating recipe: ${updateError}`);
      throw new Error('Failed to update recipe in the database.');
    }

    return {
      id,
      processed_recipe: structuredRecipe,
    };
  } catch (error) {
    logger.error(`Error generating recipe: ${error}`);
    throw new Error('Failed to generate recipe.');
  }
};
