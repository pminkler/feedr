import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
// @ts-ignore - Generated at build time
import { env } from '$amplify/env/generateInstacartUrl';
import axios from 'axios';

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
  console.log('event', event);

  // Handle OPTIONS requests for CORS preflight
  if (event.requestContext.http.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': event.headers?.origin || 'https://feedr.app', // Will dynamically respond to the origin that made the request
        'Access-Control-Allow-Headers':
          'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,POST',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json',
      },
      body: '',
    };
  }

  try {
    // Parse request body
    if (!event.body) {
      throw new Error('Missing request body');
    }

    const body = JSON.parse(event.body);
    const ingredients: IngredientInput[] = body.ingredients || [];
    const title = body.title || 'My Recipe';
    const instructions = body.instructions || [];
    const imageUrl = body.imageUrl || 'https://feedr.app/favicon.svg';
    const partnerLinkbackUrl = body.partnerLinkbackUrl || 'https://feedr.app';

    // Validate ingredients
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': event.headers?.origin || 'https://feedr.app', // Will dynamically respond to the origin that made the request
          'Access-Control-Allow-Headers':
            'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Invalid or empty ingredients list provided',
        }),
      };
    }

    // Format ingredients for Instacart API
    const formattedIngredients: InstacartIngredient[] = ingredients.map((ingredient) => {
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
            unit: ingredient.unit || '',
          },
        ],
      };
    });

    // Create recipe request object
    const recipeRequest: InstacartRecipeRequest = {
      title: title,
      image_url: imageUrl,
      link_type: 'recipe',
      instructions: instructions.length > 0 ? instructions : ['Follow your recipe instructions'],
      ingredients: formattedIngredients,
      landing_page_configuration: {
        partner_linkback_url: partnerLinkbackUrl,
        enable_pantry_items: true,
      },
    };

    console.log('Instacart API request:', JSON.stringify(recipeRequest, null, 2));

    // Call Instacart API to create recipe page
    const apiEndpoint = env.INSTACART_API_URI || 'https://connect.dev.instacart.tools';
    const response = await axios.post(`${apiEndpoint}/idp/v1/products/recipe`, recipeRequest, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${env.INSTACART_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Instacart API response:', response.data);

    // Get the base URL from the response
    const baseUrl = response.data.products_link_url;
    if (!baseUrl) {
      throw new Error('No products_link_url returned from Instacart API');
    }

    // Add affiliate tracking parameters to the Instacart URL
    let instacartUrl = baseUrl;

    try {
      // Get affiliate IDs from environment variables
      const affiliateId = env.INSTACART_AFFILIATE_ID || '6136584';
      const campaignId = env.INSTACART_CAMPAIGN_ID || '20313';

      // Append the Impact affiliate tracking parameters
      const affiliateParams = new URLSearchParams({
        utm_campaign: 'instacart-idp',
        utm_medium: 'affiliate',
        utm_source: 'instacart_idp',
        utm_term: 'partnertype-mediapartner',
        utm_content: `campaignid-${campaignId}_partnerid-${affiliateId}`,
      });

      // Check if the URL already has query parameters
      if (instacartUrl.includes('?')) {
        instacartUrl += `&${affiliateParams.toString()}`;
      } else {
        instacartUrl += `?${affiliateParams.toString()}`;
      }

      console.log('Instacart URL with affiliate tracking:', instacartUrl);
    } catch (affiliateError) {
      // If there's an error appending affiliate parameters, log it but continue with the original URL
      console.error(
        'Error adding affiliate parameters to URL:',
        affiliateError instanceof Error ? affiliateError.message : String(affiliateError)
      );
      console.log('Continuing with original URL:', instacartUrl);
    }

    // Return the recipe URL to the client
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': event.headers?.origin || 'https://feedr.app',
        'Access-Control-Allow-Headers':
          'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: instacartUrl,
        ingredients: ingredients.length,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      }),
    };
  } catch (error) {
    // Log detailed error information for debugging
    console.error('Error generating Instacart URL:', error);

    // Additional context for affiliate-related errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('affiliate') || errorMessage.includes('utm_')) {
      console.error('This may be related to the affiliate link implementation.');
      console.log('Affiliate ID:', env.INSTACART_AFFILIATE_ID);
      console.log('Campaign ID:', env.INSTACART_CAMPAIGN_ID);
    }

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': event.headers?.origin || 'https://feedr.app', // Will dynamically respond to the origin that made the request
        'Access-Control-Allow-Headers':
          'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Failed to generate Instacart URL',
        details: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
