// functions/generateRecipeImage/handler.ts

import crypto from 'crypto';
import type { Handler } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { OpenAI } from 'openai';
import { JSDOM } from 'jsdom';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import type { Schema } from '../../data/resource';
import axios from 'axios';
import { env } from '$amplify/env/generateRecipeImage';

// Configure Amplify for Data access
const { resourceConfig, libraryOptions }
  = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

const logger = new Logger({
  logLevel: 'INFO',
  serviceName: 'generate-recipe-image-handler',
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-west-2',
});

/**
 * Attempts to extract an image URL from a recipe page.
 * Uses heuristics to identify the most likely recipe image.
 */
async function extractImageFromUrl(url: string): Promise<string | null> {
  try {
    logger.info(`Attempting to extract image from URL: ${url}`);

    // Fetch the page content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    // Parse the HTML
    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    // Image selection heuristics (in order of preference)

    // 1. Look for images in structured data (JSON-LD)
    const structuredData = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map((script) => {
        try {
          return JSON.parse(script.textContent || '{}');
        }
        catch {
          return {};
        }
      })
      .filter((data) => {
        return data['@type'] === 'Recipe'
          || (Array.isArray(data['@graph'])
            && data['@graph'].some((item) => item['@type'] === 'Recipe'));
      });

    for (const data of structuredData) {
      if (data['@type'] === 'Recipe' && data.image) {
        const imageUrl = Array.isArray(data.image) ? data.image[0] : data.image;
        logger.info(`Found image in structured data: ${imageUrl}`);
        return imageUrl;
      }
      else if (Array.isArray(data['@graph'])) {
        const recipeData = data['@graph'].find((item) => item['@type'] === 'Recipe');
        if (recipeData && recipeData.image) {
          const imageUrl = Array.isArray(recipeData.image) ? recipeData.image[0] : recipeData.image;
          logger.info(`Found image in structured graph data: ${imageUrl}`);
          return imageUrl;
        }
      }
    }

    // 2. Look for images with specific recipe-related classes or IDs
    const recipeSpecificSelectors = [
      '.recipe-image', '#recipe-image',
      '.hero-image', '.primary-image',
      '.featured-image', '.main-image',
      '.recipe-hero-image', '.recipe-featured-image',
      '[itemprop="image"]',
    ];

    for (const selector of recipeSpecificSelectors) {
      const img = document.querySelector(`${selector} img`) || document.querySelector(selector);
      if (img && img.tagName === 'IMG' && img.getAttribute('src')) {
        const imageUrl = img.getAttribute('src') || '';
        if (imageUrl && !imageUrl.includes('data:image') && !imageUrl.includes('blank.gif')) {
          logger.info(`Found image with recipe-specific selector ${selector}: ${imageUrl}`);
          return new URL(imageUrl, url).toString(); // Ensure absolute URL
        }
      }
    }

    // 3. Look for large images near recipe content sections
    const recipeContainers = document.querySelectorAll(
      '.recipe, #recipe, [itemtype*="Recipe"], .recipe-container, .recipe-content',
    );

    for (const container of Array.from(recipeContainers)) {
      const images = container.querySelectorAll('img');

      // Filter for large images
      const largeImages = Array.from(images)
        .filter((img) => {
          const width = parseInt(img.getAttribute('width') || '0', 10);
          const height = parseInt(img.getAttribute('height') || '0', 10);
          return (width >= 300 || height >= 300) && img.getAttribute('src');
        })
        .sort((a, b) => {
          const aWidth = parseInt(a.getAttribute('width') || '0', 10);
          const bWidth = parseInt(b.getAttribute('width') || '0', 10);
          return bWidth - aWidth; // Sort by width descending
        });

      if (largeImages.length > 0) {
        const imageUrl = largeImages[0].getAttribute('src') || '';
        if (imageUrl && !imageUrl.includes('data:image') && !imageUrl.includes('blank.gif')) {
          logger.info(`Found large image in recipe container: ${imageUrl}`);
          return new URL(imageUrl, url).toString(); // Ensure absolute URL
        }
      }
    }

    // 4. Fall back to any large image on the page
    const allImages = document.querySelectorAll('img');
    const largeImages = Array.from(allImages)
      .filter((img) => {
        const width = parseInt(img.getAttribute('width') || '0', 10);
        const height = parseInt(img.getAttribute('height') || '0', 10);
        const src = img.getAttribute('src') || '';

        // Filter out small images, icons, and tracking pixels
        return (width >= 400 || height >= 400)
          && src
          && !src.includes('data:image')
          && !src.includes('blank.gif')
          && !src.includes('icon')
          && !src.includes('logo')
          && !src.includes('advertisement')
          && !src.includes('tracking');
      })
      .sort((a, b) => {
        const aWidth = parseInt(a.getAttribute('width') || '0', 10);
        const bWidth = parseInt(b.getAttribute('width') || '0', 10);
        return bWidth - aWidth; // Sort by width descending
      });

    if (largeImages.length > 0) {
      const imageUrl = largeImages[0].getAttribute('src') || '';
      logger.info(`Falling back to large image on page: ${imageUrl}`);
      return new URL(imageUrl, url).toString(); // Ensure absolute URL
    }

    logger.info('No suitable image found on the page');
    return null;
  }
  catch (error) {
    logger.error(`Error extracting image from URL: ${error}`);
    return null;
  }
}

/**
 * Generates an image using DALL-E based on the recipe details.
 */
async function generateImageWithDallE(
  recipeTitle: string,
  ingredients: Array<{ name: string; quantity: string; unit: string }>,
): Promise<Buffer | null> {
  try {
    logger.info(`Generating image for recipe: ${recipeTitle}`);

    // Identify main ingredients for prompt construction
    const mainIngredients = ingredients
      .filter((ing) => !ing.name.includes('salt') && !ing.name.includes('pepper') && !ing.name.includes('water'))
      .slice(0, 5)
      .map((ing) => ing.name);

    // Determine likely cuisine type based on ingredients
    let cuisineType = 'homemade';
    if (ingredients.some((ing) => ing.name.includes('soy sauce') || ing.name.includes('ginger') || ing.name.includes('sesame'))) {
      cuisineType = 'Asian';
    }
    else if (ingredients.some((ing) => ing.name.includes('pasta') || ing.name.includes('parmesan') || ing.name.includes('olive oil'))) {
      cuisineType = 'Italian';
    }
    else if (ingredients.some((ing) => ing.name.includes('tortilla') || ing.name.includes('cilantro') || ing.name.includes('jalapeño'))) {
      cuisineType = 'Mexican';
    }

    // Determine serving vessel based on recipe type
    let servingVessel = 'plate';
    if (recipeTitle.toLowerCase().includes('soup') || recipeTitle.toLowerCase().includes('stew')) {
      servingVessel = 'bowl';
    }
    else if (recipeTitle.toLowerCase().includes('drink') || recipeTitle.toLowerCase().includes('smoothie')) {
      servingVessel = 'glass';
    }

    // Craft a detailed prompt for the image generation
    const prompt = `Create a photorealistic image of ${recipeTitle}, a ${cuisineType} dish with ${mainIngredients.join(', ')}. 
Show the finished dish served on a ${servingVessel} with appropriate garnishes.
The image should be well-lit, professionally photographed from a top-down angle, 
with shallow depth of field and food styling that makes the dish look appetizing.`;

    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    // Generate the image using DALL-E
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'url',
    });

    // Get the image URL
    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      logger.error('No image URL returned from DALL-E');
      return null;
    }

    // Download the generated image
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    return Buffer.from(imageResponse.data, 'binary');
  }
  catch (error) {
    logger.error(`Error generating image with DALL-E: ${error}`);
    return null;
  }
}

/**
 * Uploads an image to S3 and returns the public URL.
 */
async function uploadImageToS3(imageBuffer: Buffer, recipeId: string): Promise<string> {
  try {
    const fileExtension = 'jpg';
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const objectKey = `recipe-images/${recipeId}-${timestamp}-${randomString}.${fileExtension}`;

    const params = {
      Bucket: env.RECIPE_IMAGES_BUCKET,
      Key: objectKey,
      Body: imageBuffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read', // Make the image publicly accessible
    };

    await s3Client.send(new PutObjectCommand(params));

    // Construct the final image URL
    const cdnDomain = env.IMAGE_CDN_PREFIX || `https://${env.RECIPE_IMAGES_BUCKET}.s3.${process.env.AWS_REGION || 'us-west-2'}.amazonaws.com`;
    const imageUrl = `${cdnDomain}/${objectKey}`;

    logger.info(`Image uploaded to S3: ${imageUrl}`);
    return imageUrl;
  }
  catch (error) {
    logger.error(`Error uploading image to S3: ${error}`);
    throw new Error('Failed to upload image to S3');
  }
}

/**
 * Main handler function for generating recipe images.
 */
export const handler: Handler = async (event) => {
  logger.info(`Received event: ${JSON.stringify(event)}`);

  const id = event.id || event.result?.Payload?.id;
  const processed_recipe = event.processed_recipe || event.result?.Payload?.processed_recipe;
  const url = event.url;

  if (!id) {
    logger.error('Missing recipe ID in input');
    throw new Error('Missing recipe ID in input');
  }

  if (!processed_recipe) {
    logger.error('Missing processed_recipe in input');
    throw new Error('Missing processed_recipe in input');
  }

  logger.info(`Generating image for recipe ID: ${id}`);

  try {
    let imageUrl: string | null = null;

    // First approach: Try to extract image from the original URL if available
    if (url) {
      imageUrl = await extractImageFromUrl(url);
      logger.info(imageUrl ? `Successfully extracted image from URL: ${imageUrl}` : 'Could not extract image from URL');
    }

    // Second approach: Generate image with DALL-E if no image was extracted from URL
    if (!imageUrl) {
      const { title, ingredients } = processed_recipe;
      logger.info(`No image found from URL, generating with DALL-E for recipe: ${title}`);

      const imageBuffer = await generateImageWithDallE(title, ingredients);
      if (imageBuffer) {
        imageUrl = await uploadImageToS3(imageBuffer, id);
        logger.info(`Successfully generated and uploaded image: ${imageUrl}`);
      }
      else {
        logger.error('Failed to generate image with DALL-E');
      }
    }

    // Update the recipe record with the image URL
    if (imageUrl) {
      try {
        await client.models.Recipe.update({
          id,
          imageUrl,
        });
        logger.info(`Updated recipe ${id} with image URL: ${imageUrl}`);
      }
      catch (updateError) {
        logger.error(`Error updating recipe with image URL: ${updateError}`);
        throw new Error('Failed to update recipe with image URL');
      }
    }
    else {
      logger.warn(`No image was generated for recipe ${id}`);
    }

    return {
      id,
      imageUrl,
    };
  }
  catch (error) {
    logger.error(`Error generating recipe image: ${error}`);
    // This is not a critical failure, so we don't want to fail the whole processing
    // Return without imageUrl but don't throw an error
    return {
      id,
      imageUrl: null,
    };
  }
};
