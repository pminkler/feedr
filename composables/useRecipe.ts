import { generateClient, post } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import { ref, computed } from 'vue';
import Fraction from 'fraction.js';
import { useAuth } from './useAuth';
import { useIdentity } from './useIdentity';
import type { Schema } from '../amplify/data/resource';
import type { RecipeTag } from '../types/models';

// Replace useState with ref for TypeScript compatibility
function useState<T>(key: string, initialValue: () => T) {
  return ref<T>(initialValue());
}

const client = generateClient<Schema>();

export function useRecipe() {
  const recipesState = useState<Record<string, Record<string, unknown>>>('recipes', () => ({}));
  type Recipe = Record<string, unknown>;
  const myRecipesState = useState<Recipe[]>('myRecipes', () => []); // State for user-created recipes
  const isMyRecipesSynced = useState<boolean>('isMyRecipesSynced', () => false); // Tracks if my recipes are synced
  const { currentUser } = useAuth();

  // Store the current subscription reference so we can cancel it when needed
  let currentSubscription: { unsubscribe: () => void } | null = null;

  const { getOwnerId, getAuthOptions } = useIdentity();

  async function createRecipe(recipeData: Record<string, unknown>) {
    try {
      const userId = currentUser.value?.username;
      // Get the identity ID for tracking creation by both guests and authenticated users
      const identityId = await getOwnerId();

      // Cast status to the appropriate literal type
      const recipeToCreate = {
        ...recipeData,
        status: 'PENDING' as const,
        nutritionalInformation: {
          status: 'PENDING' as const,
        },
        // For owners array, make sure to include either the username (for authenticated users)
        // or the identity ID (for guests) - this is critical for edit permissions
        owners: userId ? [userId] : identityId ? [identityId] : [],
        // Store the creator's identity ID to track ownership for guests
        createdBy: identityId || '',
      };

      const authOptions = await getAuthOptions();

      // Check if the Recipe model exists before calling create
      if (!client?.models?.Recipe) {
        throw new Error('Recipe model not available');
      }

      const response = await client.models.Recipe.create(recipeToCreate, authOptions);
      const recipe = Array.isArray(response?.data) ? response.data[0] : response?.data;

      if (recipe?.id) {
        recipesState.value[recipe.id] = recipe;
        return recipe;
      }
    } catch (error) {
      console.error('Error creating recipe:', error);
      throw error;
    }
  }

  async function getRecipeById(id: string) {
    const authOptions = await getAuthOptions();

    // Check if the Recipe model exists before calling get
    if (!client?.models?.Recipe) {
      throw new Error('Recipe model not available');
    }

    const response = await client.models.Recipe.get({ id }, authOptions);
    const recipe = response.data;

    // Check that recipe is an object with an id property
    if (recipe && typeof recipe === 'object' && 'id' in recipe) {
      recipesState.value[recipe.id as string] = recipe;
    }

    return recipe;
  }

  /**
   * Normalizes Unicode fraction characters (e.g., "½") in a string to ASCII fractions (e.g., "1/2").
   */
  function normalizeFractionString(str: string): string {
    // Return empty string for undefined input
    if (!str) return '';

    const unicodeMap: Record<string, string> = {
      '½': '1/2',
      '⅓': '1/3',
      '⅔': '2/3',
      '¼': '1/4',
      '¾': '3/4',
      '⅕': '1/5',
      '⅖': '2/5',
      '⅗': '3/5',
      '⅘': '4/5',
      '⅙': '1/6',
      '⅚': '5/6',
      '⅛': '1/8',
      '⅜': '3/8',
      '⅝': '5/8',
      '⅞': '7/8',
    };

    let result = str;
    Object.keys(unicodeMap).forEach((unicodeFrac) => {
      if (result.includes(unicodeFrac)) {
        // Use a safer, non-function approach - use the split and join method
        // to avoid the function-style replacement which causes TypeScript issues
        result = result.split(unicodeFrac).join(unicodeMap[unicodeFrac]);
      }
    });
    return result;
  }

  /**
   * Scales an array of ingredients by the given multiplier.
   *
   * Each ingredient should have a `quantity` string (e.g., "1 ¼", "3½").
   * The method normalizes any Unicode fractions, converts the quantity to a Fraction,
   * scales it, and converts it back to a nicely formatted mixed fraction string.
   *
   * @param ingredients Array of ingredients to scale.
   * @param multiplier The scaling factor (e.g., 2, 2.5, etc.).
   * @returns The scaled array of ingredients.
   */
  function scaleIngredients(
    ingredients: { name: string; quantity: string; unit: string }[],
    multiplier: number
  ): { name: string; quantity: string; unit: string }[] {
    return ingredients.map((ingredient) => {
      const normalizedQuantity = normalizeFractionString(ingredient.quantity);
      try {
        const fractionQuantity = new Fraction(normalizedQuantity);
        const scaledFraction = fractionQuantity.mul(multiplier);
        const newQuantity = scaledFraction.toFraction(true);

        return {
          ...ingredient,
          quantity: newQuantity,
        };
      } catch (error) {
        console.error(
          `Error parsing quantity for ${ingredient.name}: ${ingredient.quantity}`,
          error
        );
        // In case of an error, return the ingredient unmodified.
        return ingredient;
      }
    });
  }

  async function updateRecipe(recipeId: string, updateData: Record<string, unknown>) {
    try {
      // For update operation, use lambda auth mode with ownership context
      const updateAuthOptions = await getAuthOptions({
        requiresOwnership: true,
      });

      // Update the recipe
      // Check if the Recipe model exists before calling update
      if (!client?.models?.Recipe) {
        throw new Error('Recipe model not available');
      }

      const { data } = await client.models.Recipe.update(
        { id: recipeId, ...updateData },
        updateAuthOptions
      );

      if (data) {
        // Find the existing recipe in local state.
        if (recipesState.value[recipeId]) {
          // Merge the new data into the existing record (shallow merge).
          recipesState.value[recipeId] = {
            ...recipesState.value[recipeId],
            ...updateData,
          };
        } else {
          // If it doesn't exist in state, store it
          recipesState.value[recipeId] = data;
        }

        // Update in myRecipes if it exists there
        const index = myRecipesState.value.findIndex((record: Recipe) => record.id === recipeId);

        if (index !== -1) {
          const existing = myRecipesState.value[index];
          myRecipesState.value[index] = { ...existing, ...updateData };
        }

        return data;
      }
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  }

  // RecipeTag is now imported from the types/models

  const recipeTags = computed(() => {
    const uniqueTags: RecipeTag[] = [];
    const tagMap = new Map<string, RecipeTag>();

    // Get tags from all user recipes
    // Check that myRecipesState.value is an array before iterating
    if (Array.isArray(myRecipesState.value)) {
      myRecipesState.value.forEach((recipe: Recipe) => {
        const tags = recipe.tags as RecipeTag[] | undefined;
        if (tags && Array.isArray(tags)) {
          tags.forEach((tag: RecipeTag) => {
            if (tag && tag.name && !tagMap.has(tag.name)) {
              tagMap.set(tag.name, tag);
              uniqueTags.push(tag);
            }
          });
        }
      });
    }

    return uniqueTags;
  });

  /**
   * Gets all Recipes created by the current user (authenticated or guest).
   * This is a one-time fetch that will update the myRecipesState.
   */
  async function getMyRecipes() {
    try {
      // Try with identity ID (works for both authenticated and guest users)
      const session = await fetchAuthSession();
      const identityId = session.identityId;
      const username = currentUser.value?.username;

      if (!identityId && !username) {
        console.warn('Could not determine user identity');
        myRecipesState.value = [];
        return [];
      }

      console.log('Identity info:', { identityId, username });

      // Get auth options
      const authOptions = await getAuthOptions();

      // Build query filter with OR conditions to handle both identity ID and username
      let filter = {};

      // If we have both identityId and username, create an OR condition
      if (identityId && username) {
        filter = {
          or: [
            {
              owners: {
                contains: identityId,
              },
            },
            {
              owners: {
                contains: username,
              },
            },
          ],
        };
      }
      // For identity ID-based lookup only
      else if (identityId) {
        filter = {
          owners: {
            contains: identityId,
          },
        };
      }
      // For username only
      else if (username) {
        filter = {
          owners: {
            contains: username,
          },
        };
      }

      console.log('Using filter:', filter);

      const response = await client.models.Recipe.list({
        filter,
        selectionSet: [
          'id',
          'title',
          'description',
          'prep_time',
          'cook_time',
          'servings',
          'imageUrl',
          'ingredients.*',
          'instructions',
          'nutritionalInformation.*',
          'tags.*',
          'owners',
          'createdBy',
          'createdAt',
          'updatedAt',
        ],
        ...authOptions,
      });

      const myRecipes = response.data || [];
      console.log(`Found ${myRecipes.length} recipes`);

      if (myRecipes.length > 0 && typeof myRecipes[0] === 'object') {
        const firstRecipe = myRecipes[0] as Record<string, unknown>;
        console.log('Sample recipe owners:', firstRecipe.owners || []);
        console.log('Sample recipe title:', firstRecipe.title || 'Untitled');
      }

      // Update state with the fetched recipes
      myRecipesState.value = myRecipes;
      return myRecipes;
    } catch (error) {
      console.error('Error fetching my recipes:', error);
      myRecipesState.value = [];
      return [];
    }
  }

  /**
   * Sets up a subscription to recipes owned by the current user.
   * This will keep myRecipesState in sync with real-time updates.
   * Cancels any existing subscription before creating a new one.
   */
  function subscribeToMyRecipes() {
    try {
      // Set synced flag to false when resetting subscription
      isMyRecipesSynced.value = false;

      // Cancel existing subscription if there is one
      if (currentSubscription) {
        console.log('Cancelling existing recipe subscription');
        currentSubscription.unsubscribe();
        currentSubscription = null;
      }

      // Try with identity ID (works for both authenticated and guest users)
      return fetchAuthSession()
        .then((session) => {
          const identityId = session.identityId;
          const username = currentUser.value?.username;

          if (!identityId && !username) {
            console.warn('Could not determine user identity for subscription');
            isMyRecipesSynced.value = false;
            return null;
          }

          // Get auth options
          return getAuthOptions().then((authOptions) => {
            // Build query filter with OR conditions to handle both identity ID and username
            let filter = {};

            // If we have both identityId and username, create an OR condition
            if (identityId && username) {
              filter = {
                or: [
                  {
                    owners: {
                      contains: identityId,
                    },
                  },
                  {
                    owners: {
                      contains: username,
                    },
                  },
                ],
              };
            }
            // For identity ID-based lookup only
            else if (identityId) {
              filter = {
                owners: {
                  contains: identityId,
                },
              };
            }
            // For username only
            else if (username) {
              filter = {
                owners: {
                  contains: username,
                },
              };
            }

            console.log('Setting up subscription with filter:', filter);

            // Setup subscription to recipes owned by current user
            const subscription = client.models.Recipe.observeQuery({
              filter,
              selectionSet: [
                'id',
                'title',
                'description',
                'prep_time',
                'cook_time',
                'servings',
                'imageUrl',
                'ingredients.*',
                'instructions',
                'nutritionalInformation.*',
                'tags.*',
                'owners',
                'createdBy',
                'createdAt',
                'updatedAt',
              ],
              ...authOptions,
            }).subscribe({
              next: ({ items, isSynced }) => {
                console.log(
                  `Received ${items.length} recipes via subscription, isSynced: ${isSynced}`
                );
                if (items.length > 0 && typeof items[0] === 'object') {
                  const firstItem = items[0] as Record<string, unknown>;
                  console.log('Sample recipe title:', firstItem.title || 'Untitled');
                }
                myRecipesState.value = items;

                // Update the synced state based on the isSynced value from the subscription
                isMyRecipesSynced.value = isSynced;
              },
            });

            // Store the subscription reference so we can cancel it later
            currentSubscription = subscription;

            return subscription;
          });
        })
        .catch((error) => {
          console.error('Error setting up recipe subscription:', error);
          isMyRecipesSynced.value = false;
          return null;
        });
    } catch (error) {
      console.error('Error in subscribeToMyRecipes:', error);
      isMyRecipesSynced.value = false;
      return null;
    }
  }

  /**
   * Creates a copy of an existing recipe for the current user
   * @param recipeId The ID of the recipe to copy
   * @returns The newly created recipe
   */
  async function copyRecipe(recipeId: string) {
    try {
      // Get the original recipe
      const originalRecipe = await getRecipeById(recipeId);

      if (!originalRecipe) {
        throw new Error('Original recipe not found');
      }

      // Cast the original recipe to Record<string, unknown> for type-safe access
      const recipeObj = originalRecipe as Record<string, unknown>;
      const isProcessed = recipeObj.status === 'SUCCESS';

      // Create a copy of the recipe data without the id, owners, and metadata fields
      // Use recipeObj with type assertion for safe property access
      const recipeCopy = {
        title: recipeObj.title as string | undefined,
        description: recipeObj.description as string | undefined,
        ingredients: recipeObj.ingredients as Array<Record<string, unknown>> | undefined,
        instructions: recipeObj.instructions as string[] | undefined,
        nutritionalInformation: recipeObj.nutritionalInformation as
          | Record<string, unknown>
          | undefined,
        prep_time: recipeObj.prep_time as string | undefined,
        cook_time: recipeObj.cook_time as string | undefined,
        servings: recipeObj.servings as string | undefined,
        imageUrl: recipeObj.imageUrl as string | undefined,
        url: recipeObj.url as string | undefined,
        tags: recipeObj.tags as Array<Record<string, unknown>> | undefined,
      };

      const userId = currentUser.value?.username;
      const identityId = await getOwnerId();

      // For a processed recipe, bypass the Step Function workflow
      // by directly creating it with SUCCESS status
      if (isProcessed) {
        const processedRecipe = {
          ...recipeCopy,
          status: 'SUCCESS' as const,
          nutritionalInformation: {
            ...recipeCopy.nutritionalInformation,
            status: 'SUCCESS' as const,
          },
          owners: userId ? [userId] : identityId ? [identityId] : [],
          createdBy: identityId || '',
        };

        const authOptions = await getAuthOptions();
        const response = await client.models.Recipe.create(processedRecipe, authOptions);

        const recipe = Array.isArray(response?.data) ? response.data[0] : response?.data;

        if (recipe?.id) {
          recipesState.value[recipe.id] = recipe;
          return recipe;
        }
      } else {
        // For unprocessed recipes, use the standard creation flow
        const newRecipe = await createRecipe(recipeCopy);
        return newRecipe;
      }
    } catch (error) {
      console.error('Error copying recipe:', error);
      throw error;
    }
  }

  /**
   * Generates an Instacart URL for a recipe page with ingredients and instructions
   * @param ingredients List of ingredients to add to Instacart cart
   * @param recipeData Optional recipe data to enhance the Instacart experience
   * @returns Object containing the generated Instacart URL and expiration info
   */
  async function generateInstacartUrl(
    ingredients: { name: string; quantity?: string; unit?: string }[],
    recipeData?: {
      title?: string;
      instructions?: string[];
      imageUrl?: string;
    }
  ) {
    try {
      if (!ingredients || ingredients.length === 0) {
        throw new Error('No ingredients provided');
      }

      // Format ingredients for the API request
      const formattedIngredients = ingredients.map((ingredient) => {
        // Handle quantity: don't convert "0" to empty string, but keep truly empty values empty
        let quantityValue = '';
        if (ingredient.quantity !== undefined && ingredient.quantity !== null) {
          // If we have a quantity value and it's not "0", use it
          // Convert to string for consistent comparison
          const quantityStr = String(ingredient.quantity);
          if (quantityStr !== '0') {
            quantityValue = quantityStr;
          }
          // If it's "0", we'll leave it as empty string
        }

        // Handle unit: ensure blank units stay blank
        let unitValue = '';
        if (ingredient.unit) {
          // If unit is an object (from the USelectMenu), extract its value
          if (typeof ingredient.unit === 'object' && ingredient.unit !== null) {
            // Type assertion for the object structure
            const unitObj = ingredient.unit as { value?: string };
            unitValue = unitObj.value || '';
          } else {
            unitValue = String(ingredient.unit);
          }
        }

        return {
          name: ingredient.name.trim().toLowerCase(),
          quantity: quantityValue,
          unit: unitValue,
        };
      });

      // Get current page URL for partner linkback
      const currentUrl = window.location.href;

      // Use the Amplify API client for POST request with credentials
      const restOperation = post({
        apiName: 'instacartApi',
        path: 'instacart/generate-url',
        options: {
          body: {
            ingredients: formattedIngredients,
            title: recipeData?.title || 'My Recipe',
            instructions: recipeData?.instructions || [],
            imageUrl: recipeData?.imageUrl || '',
            partnerLinkbackUrl: currentUrl,
          },
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        },
      });

      const responseObj = await restOperation.response;

      if (!responseObj || !responseObj.body) {
        throw new Error('Invalid API response');
      }

      const responseData = await responseObj.body.json();

      console.log('POST call succeeded');
      console.log(responseData);

      // Check if we got a proper response object
      if (!responseData || typeof responseData !== 'object') {
        throw new Error('Invalid response format from API');
      }

      // Cast the response to a Record for type-safe property access
      const typedResponse = responseData as Record<string, unknown>;

      // In compliance with Instacart terms, we don't store any user data
      // beyond the URL and basic information needed for UI feedback
      return {
        url: typeof typedResponse.url === 'string' ? typedResponse.url : '',
        ingredients: Array.isArray(typedResponse.ingredients) ? typedResponse.ingredients : [],
        expiresAt: typeof typedResponse.expiresAt === 'string' ? typedResponse.expiresAt : '',
      };
    } catch (error: unknown) {
      console.log('POST call failed: ', error);
      // Check if error is an object with a response property
      if (error && typeof error === 'object') {
        const errorObj = error as Record<string, unknown>;
        if ('response' in errorObj && errorObj.response) {
          try {
            const errorResponse = errorObj.response as { body?: { text?: () => Promise<string> } };
            if (errorResponse.body && typeof errorResponse.body.text === 'function') {
              const errorDetails = await errorResponse.body.text();
              console.log('Error details: ', JSON.parse(errorDetails));
            }
          } catch {
            console.log('Could not parse error body');
          }
        }
      }
      throw error;
    }
  }

  /**
   * Delete all recipes associated with the current user.
   * Used for account deletion to ensure all user data is removed.
   */
  async function deleteAllRecipes() {
    try {
      // First, get all user recipes
      const recipes = await getMyRecipes();

      if (!recipes || recipes.length === 0) {
        console.log('No recipes to delete');
        return true; // No recipes to delete is a successful state
      }

      console.log(`Deleting ${recipes.length} recipes for account deletion`);

      // Get auth options with ownership context
      const authOptions = await getAuthOptions({ requiresOwnership: true });

      // Delete each recipe
      const deletePromises = recipes.map(async (recipe) => {
        try {
          await client.models.Recipe.delete(
            {
              id: recipe.id,
            },
            authOptions
          );

          return true;
        } catch (error) {
          console.error(`Error deleting recipe ${recipe.id}:`, error);
          return false;
        }
      });

      // Wait for all delete operations to complete
      const results = await Promise.all(deletePromises);

      // Check if all operations were successful
      const allSuccessful = results.every((result) => result === true);

      // Clear local state
      recipesState.value = {};
      myRecipesState.value = [];

      return allSuccessful;
    } catch (error) {
      console.error('Error in deleteAllRecipes:', error);
      throw error;
    }
  }

  /**
   * Cancels the current recipe subscription if one exists.
   * Call this during component unmounting to prevent memory leaks.
   */
  function unsubscribeFromMyRecipes() {
    if (currentSubscription) {
      console.log('Cleaning up recipe subscription');
      currentSubscription.unsubscribe();
      currentSubscription = null;
      isMyRecipesSynced.value = false;
    }
  }

  return {
    recipesState,
    myRecipesState,
    isMyRecipesSynced,
    recipeTags,
    updateRecipe,
    createRecipe,
    getRecipeById,
    getMyRecipes,
    subscribeToMyRecipes,
    unsubscribeFromMyRecipes,
    scaleIngredients,
    copyRecipe,
    generateInstacartUrl,
    deleteAllRecipes,
  };
}
