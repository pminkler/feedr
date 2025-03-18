import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { env } from "$amplify/env/generateInstacartUrl";
import axios from "axios";

interface IngredientInput {
  name: string;
  quantity?: string;
  unit?: string;
}

interface InstacartMeasurement {
  quantity: number;
  unit: string;
}

interface InstacartIngredient {
  name: string;
  display_text?: string;
  measurements: InstacartMeasurement[];
}

interface InstacartRecipeRequest {
  title: string;
  image_url?: string;
  link_type: string;
  instructions: string[];
  ingredients: InstacartIngredient[];
  landing_page_configuration: {
    partner_linkback_url: string;
    enable_pantry_items: boolean;
  };
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  console.log("event", event);

  // Handle OPTIONS requests for CORS preflight
  if (event.requestContext.http.method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin":
          event.headers?.origin || "https://feedr.app",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "OPTIONS,POST",
        "Access-Control-Allow-Credentials": "true",
        "Content-Type": "application/json",
      },
      body: "",
    };
  }

  try {
    // Parse request body
    if (!event.body) {
      throw new Error("Missing request body");
    }

    const body = JSON.parse(event.body);
    const ingredients: IngredientInput[] = body.ingredients || [];
    const title = body.title || "My Recipe";
    const instructions = body.instructions || [];
    const imageUrl = body.imageUrl || "https://feedr.app/favicon.svg";
    const partnerLinkbackUrl = body.partnerLinkbackUrl || "https://feedr.app";

    // Validate ingredients
    if (
      !ingredients ||
      !Array.isArray(ingredients) ||
      ingredients.length === 0
    ) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin":
            event.headers?.origin || "https://feedr.app",
          "Access-Control-Allow-Headers":
            "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
          "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
          "Access-Control-Allow-Credentials": "true",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Invalid or empty ingredients list provided",
        }),
      };
    }

    // Format ingredients for Instacart API
    const formattedIngredients: InstacartIngredient[] = ingredients.map(
      (ingredient) => {
        // Parse quantity as a number if possible
        let quantity = 1;
        if (ingredient.quantity) {
          const parsedQuantity = parseFloat(ingredient.quantity);
          if (!isNaN(parsedQuantity)) {
            quantity = parsedQuantity;
          }
        }

        return {
          name: ingredient.name.trim(),
          measurements: [
            {
              quantity: quantity,
              unit: ingredient.unit || "",
            },
          ],
        };
      },
    );

    // Create recipe request object
    const recipeRequest: InstacartRecipeRequest = {
      title: title,
      image_url: imageUrl,
      link_type: "recipe",
      instructions:
        instructions.length > 0
          ? instructions
          : ["Follow your recipe instructions"],
      ingredients: formattedIngredients,
      landing_page_configuration: {
        partner_linkback_url: partnerLinkbackUrl,
        enable_pantry_items: true,
      },
    };

    console.log(
      "Instacart API request:",
      JSON.stringify(recipeRequest, null, 2),
    );

    // Call Instacart API to create recipe page
    const apiEndpoint =
      env.INSTACART_API_URI || "https://connect.dev.instacart.tools";
    const response = await axios.post(
      `${apiEndpoint}/idp/v1/products/recipe`,
      recipeRequest,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${env.INSTACART_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Instacart API response:", response.data);

    // Return the recipe URL to the client
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin":
          event.headers?.origin || "https://feedr.app",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        "Access-Control-Allow-Credentials": "true",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: response.data.products_link_url,
        ingredients: ingredients.length,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      }),
    };
  } catch (error) {
    console.error("Error generating Instacart URL:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin":
          event.headers?.origin || "https://feedr.app",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        "Access-Control-Allow-Credentials": "true",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Failed to generate Instacart URL",
        details: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
