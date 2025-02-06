// functions/generateInstacartUrl/index.ts

import type { Handler } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import type { Schema } from "../../data/resource";
import { env } from "$amplify/env/generateInstacartUrl";

const logger = new Logger({
  logLevel: "INFO",
  serviceName: "generate-instacart-url-handler",
});

let client;
try {
  // Configure Amplify for Data access
  const { resourceConfig, libraryOptions } =
    await getAmplifyDataClientConfig(env);
  Amplify.configure(resourceConfig, libraryOptions);
  client = generateClient<Schema>();
} catch (configError) {
  logger.error(`Failed to initialize Amplify client: ${configError}`);
  throw new Error(
    "Failed to initialize Amplify client due to malformed environment variables.",
  );
}

/**
 * A simple helper to convert a quantity string to a number.
 * For example, "1 1/2" converts to 1.5. This may need enhancement for more formats.
 */
function parseQuantity(quantity: string): number {
  if (!quantity) return 0;
  const parts = quantity.trim().split(" ");
  let total = 0;
  for (const part of parts) {
    if (part.includes("/")) {
      const [num, den] = part.split("/");
      total += parseFloat(num) / parseFloat(den);
    } else {
      total += parseFloat(part);
    }
  }
  return total;
}

export const handler: Handler = async (event) => {
  logger.info(`Received event: ${JSON.stringify(event)}`);

  // Extract the recipe ID and the processed recipe data.
  const id = event.id || event.result?.Payload?.id;
  const recipe = event.result?.Payload?.processed_recipe;

  if (!id || !recipe) {
    logger.error("Missing 'id' or 'processed_recipe' in the event payload.");
    throw new Error("Missing 'id' or 'processed_recipe'.");
  }

  const { title, instructions, ingredients, image } = recipe;

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    logger.error("Missing or empty 'ingredients' in processed_recipe.");
    throw new Error("Missing or empty 'ingredients' field.");
  }

  // Map your recipe ingredients to the Instacart API format.
  // Each ingredient must include a name, display_text, and an array of measurements.
  const instacartIngredients = ingredients.map((ing: any) => {
    return {
      name: ing.name,
      display_text: ing.name, // You might want to adjust this if you have a nicer label.
      measurements: [
        {
          quantity: parseQuantity(ing.quantity),
          unit: ing.unit,
        },
      ],
    };
  });

  // Build the request payload for the Instacart API.
  // In this example:
  // - `title` and `instructions` come from your recipe.
  // - `image_url` uses the recipe's image field (or can be an empty string if not available).
  // - `landing_page_configuration.partner_linkback_url` uses the event's URL.
  const payload = {
    title: title,
    image_url: image || "", // Ensure you provide a valid image URL if available.
    link_type: "recipe",
    instructions: instructions, // Should be an array of strings.
    ingredients: instacartIngredients,
    landing_page_configuration: {
      partner_linkback_url: event.url, // This can be your website URL where users return.
      enable_pantry_items: true,
    },
  };

  logger.info(`Sending payload to Instacart API: ${JSON.stringify(payload)}`);

  try {
    // Call Instacart's API to create a recipe page.
    const instacartResponse = await fetch(
      `${env.INSTACART_API_URI}/idp/v1/products/recipe`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${env.INSTACART_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!instacartResponse.ok) {
      const errorText = await instacartResponse.text();
      throw new Error(
        `Instacart API error: ${instacartResponse.status} - ${errorText}`,
      );
    }

    const responseData = await instacartResponse.json();
    const productsLinkUrl = responseData.products_link_url;
    logger.info(`Received Instacart link: ${productsLinkUrl}`);

    // Update the Recipe record with the Instacart information.
    try {
      const updateResponse = await client.models.Recipe.update({
        id,
        instacart: {
          url: productsLinkUrl,
          status: "SUCCESS",
        },
      });
      logger.info(
        `Updated Recipe record with Instacart info: ${JSON.stringify(updateResponse)}`,
      );
    } catch (updateError) {
      logger.error(`Failed to update Recipe record: ${updateError}`);
      throw new Error(
        "Failed to update Recipe record with Instacart information.",
      );
    }

    return {
      id,
      instacart_url: productsLinkUrl,
      instacart_status: "SUCCESS",
    };
  } catch (error: any) {
    logger.error(`Error calling Instacart API: ${error.message}`);
    throw new Error(`Error calling Instacart API: ${error.message}`);
  }
};
