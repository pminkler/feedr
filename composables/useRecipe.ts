import { generateClient } from "aws-amplify/data";
import { fetchAuthSession } from "aws-amplify/auth";
import { post } from "aws-amplify/api";
import type { Schema } from "@/amplify/data/resource";
import { useState } from "#app";
import Fraction from "fraction.js";
import { useAuth } from "~/composables/useAuth";
import { useIdentity } from "~/composables/useIdentity";
import type { AuthMode } from "@aws-amplify/data-schema-types";
import type { RecipeTag } from "~/types/models";

const client = generateClient<Schema>();

export function useRecipe() {
  const recipesState = useState<Record<string, Record<string, any>>>(
    "recipes",
    () => ({}),
  );
  const savedRecipesState = useState<any[]>("savedRecipes", () => []); // State for saved recipes
  const myRecipesState = useState<any[]>("myRecipes", () => []); // State for user-created recipes
  const { currentUser } = useAuth();

  const { getOwnerId, getAuthOptions } = useIdentity();
  
  async function createRecipe(recipeData: Record<string, any>) {
    try {
      const userId = currentUser.value?.username;
      // Get the identity ID for tracking creation by both guests and authenticated users
      const identityId = await getOwnerId();
      
      const recipeToCreate = {
        ...recipeData,
        status: "PENDING",
        nutritionalInformation: {
          status: "PENDING",
        },
        // For owners array, make sure to include either the username (for authenticated users)
        // or the identity ID (for guests) - this is critical for edit permissions
        owners: userId ? [userId] : (identityId ? [identityId] : []),
        // Store the creator's identity ID to track ownership for guests
        createdBy: identityId || "",
      };
      
      const authOptions = await getAuthOptions();
      const response = await client.models.Recipe.create(
        recipeToCreate,
        authOptions
      );

      const recipe = Array.isArray(response?.data)
        ? response.data[0]
        : response?.data;

      if (recipe?.id) {
        recipesState.value[recipe.id] = recipe;
        return recipe;
      }
    } catch (error) {
      console.error("Error creating recipe:", error);
      throw error;
    }
  }
  
  async function getRecipeById(id: string) {
    const authOptions = await getAuthOptions();
    const response = await client.models.Recipe.get({ id }, authOptions);
    const recipe = response.data;
    if (recipe && recipe.id) {
      recipesState.value[recipe.id] = recipe;
    }
    return recipe;
  }

  /**
   * Gets all Recipes where the current user is in the owners array.
   */
  async function getSavedRecipes() {
    try {
      // Try with identity ID (works for both authenticated and guest users)
      const session = await fetchAuthSession();
      const identityId = session.identityId;
      const username = currentUser.value?.username;
      
      if (!identityId && !username) {
        console.warn("Could not determine user identity");
        savedRecipesState.value = [];
        return [];
      }
      
      console.log("Identity info for saved recipes:", { identityId, username });
      
      // Get auth options
      const authOptions = await getAuthOptions();
      
      // Build query filter with OR conditions to handle both identity ID and username
      let filter = {};
      
      // For identity ID-based lookup
      if (identityId) {
        filter = {
          owners: {
            contains: identityId
          }
        };
      }
      // Fallback to username if no identity ID
      else if (username) {
        filter = {
          owners: {
            contains: username
          }
        };
      }
      
      console.log("Using filter for saved recipes:", filter);
      
      const response = await client.models.Recipe.list({
        filter,
        selectionSet: [
          "id",
          "title",
          "description",
          "prep_time",
          "cook_time",
          "servings",
          "imageUrl",
          "ingredients.*",
          "instructions",
          "nutritionalInformation.*", 
          "tags.*",
          "owners",
          "createdBy",
          "createdAt",
          "updatedAt"
        ],
        ...authOptions,
      });
      
      const savedRecipes = response.data || [];
      console.log(`Found ${savedRecipes.length} saved recipes using identity ID ${identityId}`);
      
      if (savedRecipes.length > 0) {
        console.log("Sample saved recipe owners:", savedRecipes[0].owners);
        console.log("Sample saved recipe title:", savedRecipes[0].title);
      } else if (username && identityId) {
        // Try fallback query with username if identity ID query returned no results
        console.log("Trying fallback query with username for saved recipes:", username);
        
        const fallbackResponse = await client.models.Recipe.list({
          filter: {
            owners: {
              contains: username
            }
          },
          selectionSet: [
            "id",
            "title",
            "description",
            "prep_time",
            "cook_time",
            "servings",
            "imageUrl",
            "ingredients.*",
            "instructions",
            "nutritionalInformation.*", 
            "tags.*",
            "owners",
            "createdBy",
            "createdAt",
            "updatedAt"
          ],
          ...authOptions,
        });
        
        const fallbackRecipes = fallbackResponse.data || [];
        console.log(`Found ${fallbackRecipes.length} saved recipes using username fallback ${username}`);
        
        if (fallbackRecipes.length > 0) {
          console.log("Sample fallback saved recipe owners:", fallbackRecipes[0].owners);
          savedRecipesState.value = fallbackRecipes;
          return fallbackRecipes;
        }
      }
      
      savedRecipesState.value = savedRecipes;
      return savedRecipes;
    } catch (error) {
      console.error("Error fetching saved recipes:", error);
      savedRecipesState.value = [];
      return [];
    }
  }

  /**
   * Normalizes Unicode fraction characters (e.g., "½") in a string to ASCII fractions (e.g., "1/2").
   */
  function normalizeFractionString(str: string): string {
    const unicodeMap: Record<string, string> = {
      "½": "1/2",
      "⅓": "1/3",
      "⅔": "2/3",
      "¼": "1/4",
      "¾": "3/4",
      "⅕": "1/5",
      "⅖": "2/5",
      "⅗": "3/5",
      "⅘": "4/5",
      "⅙": "1/6",
      "⅚": "5/6",
      "⅛": "1/8",
      "⅜": "3/8",
      "⅝": "5/8",
      "⅞": "7/8",
    };

    Object.keys(unicodeMap).forEach((unicodeFrac) => {
      if (str.includes(unicodeFrac)) {
        // Use a global replacement in case there are multiple occurrences.
        str = str.replace(
          new RegExp(unicodeFrac, "g"),
          unicodeMap[unicodeFrac],
        );
      }
    });
    return str;
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
    multiplier: number,
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
          error,
        );
        // In case of an error, return the ingredient unmodified.
        return ingredient;
      }
    });
  }

  /**
   * Updates a Recipe to add the current user as an owner (bookmark the recipe)
   * @param recipeId The ID of the Recipe to save.
   * @returns The updated Recipe record.
   */
  async function saveRecipe(recipeId: string) {
    try {
      // Get the owner ID (username for authenticated users, identity ID for guests)
      const ownerId = await getOwnerId();
      
      if (!ownerId) {
        throw new Error("Unable to determine user identity");
      }
      
      // Get standard auth options for reading the recipe
      const readAuthOptions = await getAuthOptions();
      
      // First, get the original recipe data
      const recipeResponse = await client.models.Recipe.get(
        { id: recipeId },
        readAuthOptions
      );
      
      if (!recipeResponse.data) {
        throw new Error("Recipe not found");
      }
      
      const recipe = recipeResponse.data;
      const currentOwners = recipe.owners || [];
      
      // Check if user is already an owner
      if (currentOwners.includes(ownerId)) {
        return recipe; // User already owns this recipe
      }
      
      // Add user to owners array
      const updatedOwners = [...currentOwners, ownerId];
      
      // For update operation that modifies owners, use lambda auth mode with ownership context
      const updateAuthOptions = await getAuthOptions({ requiresOwnership: true });
      
      // Update the recipe with the new owners array
      const { data } = await client.models.Recipe.update(
        {
          id: recipeId,
          owners: updatedOwners,
        },
        updateAuthOptions,
      );
      
      // Update the local state
      if (data) {
        recipesState.value[recipeId] = data;
      }
      
      return data;
    } catch (error) {
      console.error("Error saving recipe:", error);
      throw error;
    }
  }

  /**
   * Updates a Recipe to remove the current user from the owners array (unbookmark the recipe)
   * @param recipeId The ID of the Recipe to unsave.
   * @returns The updated Recipe record.
   */
  async function unsaveRecipe(recipeId: string) {
    try {
      // Get the owner ID (username for authenticated users, identity ID for guests)
      const ownerId = await getOwnerId();
      
      if (!ownerId) {
        throw new Error("Unable to determine user identity");
      }
      
      // Get standard auth options for reading the recipe
      const readAuthOptions = await getAuthOptions();
      
      // First, get the original recipe data
      const recipeResponse = await client.models.Recipe.get(
        { id: recipeId },
        readAuthOptions
      );
      
      if (!recipeResponse.data) {
        throw new Error("Recipe not found");
      }
      
      const recipe = recipeResponse.data;
      const currentOwners = recipe.owners || [];
      
      // Check if user is an owner
      if (!currentOwners.includes(ownerId)) {
        return recipe; // User is not an owner of this recipe
      }
      
      // Remove user from owners array
      const updatedOwners = currentOwners.filter(owner => owner !== ownerId);
      
      // For update operation that modifies owners, use lambda auth mode with ownership context
      const updateAuthOptions = await getAuthOptions({ requiresOwnership: true });
      
      // Update the recipe with the new owners array
      const { data } = await client.models.Recipe.update(
        {
          id: recipeId,
          owners: updatedOwners,
        },
        updateAuthOptions,
      );
      
      // Update the local state
      if (data) {
        recipesState.value[recipeId] = data;
      }
      
      return data;
    } catch (error) {
      console.error("Error unsaving recipe:", error);
      throw error;
    }
  }

  async function updateRecipe(
    recipeId: string,
    updateData: Record<string, any>,
  ) {
    try {
      // Get the owner ID (username for authenticated users, identity ID for guests)
      const ownerId = await getOwnerId();
      
      if (!ownerId) {
        throw new Error("Unable to determine user identity");
      }
      
      // Get standard auth options for reading the recipe
      const readAuthOptions = await getAuthOptions();
      
      // Check if user is an owner
      const recipeResponse = await client.models.Recipe.get(
        { id: recipeId },
        readAuthOptions
      );
      
      if (!recipeResponse.data) {
        throw new Error("Recipe not found");
      }
      
      const recipe = recipeResponse.data;
      
      // Check if user is in owners array using identity ID or username
      if (!recipe.owners?.includes(ownerId)) {
        throw new Error("You don't have permission to update this recipe.");
      }
      
      // For update operation, use lambda auth mode with ownership context
      const updateAuthOptions = await getAuthOptions({ requiresOwnership: true });
      
      // Update the recipe
      const { data } = await client.models.Recipe.update(
        { id: recipeId, ...updateData },
        updateAuthOptions,
      );
      
      if (data) {
        // Find the existing recipe in local state.
        if (recipesState.value[recipeId]) {
          // Merge the new data into the existing record (shallow merge).
          recipesState.value[recipeId] = { ...recipesState.value[recipeId], ...updateData };
        } else {
          // If it doesn't exist in state, store it
          recipesState.value[recipeId] = data;
        }
        
        // Also update in savedRecipes if it exists there
        const index = savedRecipesState.value.findIndex(
          (record: any) => record.id === recipeId,
        );
        
        if (index !== -1) {
          const existing = savedRecipesState.value[index];
          savedRecipesState.value[index] = { ...existing, ...updateData };
        }
        
        return data;
      }
    } catch (error) {
      console.error("Error updating recipe:", error);
      throw error;
    }
  }

  const recipeTags = computed(() => {
    const uniqueTags: RecipeTag[] = [];
    const tagMap = new Map<string, RecipeTag>();
    
    // Get tags from all saved recipes (where user is an owner)
    savedRecipesState.value.forEach((recipe: any) => {
      recipe.tags?.forEach((tag: RecipeTag) => {
        if (tag && tag.name && !tagMap.has(tag.name)) {
          tagMap.set(tag.name, tag);
          uniqueTags.push(tag);
        }
      });
    });
    
    return uniqueTags;
  });

  /**
   * Gets all Recipes created by the current user (authenticated or guest).
   */
  async function getMyRecipes() {
    try {
      // Try with identity ID (works for both authenticated and guest users)
      const session = await fetchAuthSession();
      const identityId = session.identityId;
      const username = currentUser.value?.username;
      
      if (!identityId && !username) {
        console.warn("Could not determine user identity");
        myRecipesState.value = [];
        return [];
      }
      
      console.log("Identity info:", { identityId, username });
      
      // Get auth options
      const authOptions = await getAuthOptions();
      
      // Build query filter with OR conditions to handle both identity ID and username
      let filter = {};
      
      // For identity ID-based lookup
      if (identityId) {
        filter = {
          owners: {
            contains: identityId
          }
        };
      }
      // Fallback to username if no identity ID
      else if (username) {
        filter = {
          owners: {
            contains: username
          }
        };
      }
      
      console.log("Using filter:", filter);
      
      const response = await client.models.Recipe.list({
        filter,
        selectionSet: [
          "id",
          "title",
          "description",
          "prep_time",
          "cook_time",
          "servings",
          "imageUrl",
          "ingredients.*",
          "instructions",
          "nutritionalInformation.*", 
          "tags.*",
          "owners",
          "createdBy",
          "createdAt",
          "updatedAt"
        ],
        ...authOptions,
      });
      
      const myRecipes = response.data || [];
      console.log(`Found ${myRecipes.length} recipes using identity ID ${identityId}`);
      
      if (myRecipes.length > 0) {
        console.log("Sample recipe owners:", myRecipes[0].owners);
        console.log("Sample recipe title:", myRecipes[0].title);
      } else if (username && identityId) {
        // Try fallback query with username if identity ID query returned no results
        console.log("Trying fallback query with username:", username);
        
        const fallbackResponse = await client.models.Recipe.list({
          filter: {
            owners: {
              contains: username
            }
          },
          selectionSet: [
            "id",
            "title",
            "description",
            "prep_time",
            "cook_time",
            "servings",
            "imageUrl",
            "ingredients.*",
            "instructions",
            "nutritionalInformation.*", 
            "tags.*",
            "owners",
            "createdBy",
            "createdAt",
            "updatedAt"
          ],
          ...authOptions,
        });
        
        const fallbackRecipes = fallbackResponse.data || [];
        console.log(`Found ${fallbackRecipes.length} recipes using username fallback ${username}`);
        
        if (fallbackRecipes.length > 0) {
          console.log("Sample fallback recipe owners:", fallbackRecipes[0].owners);
          myRecipesState.value = fallbackRecipes;
          return fallbackRecipes;
        }
      }
      
      myRecipesState.value = myRecipes;
      return myRecipes;
    } catch (error) {
      console.error("Error fetching my recipes:", error);
      myRecipesState.value = [];
      return [];
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
        throw new Error("Original recipe not found");
      }
      
      // Check if original recipe is already processed
      const isProcessed = originalRecipe.status === "SUCCESS";
      
      // Create a copy of the recipe data without the id, owners, and metadata fields
      const recipeCopy = {
        title: originalRecipe.title,
        description: originalRecipe.description,
        ingredients: originalRecipe.ingredients,
        instructions: originalRecipe.instructions,
        nutritionalInformation: originalRecipe.nutritionalInformation,
        prep_time: originalRecipe.prep_time,
        cook_time: originalRecipe.cook_time,
        servings: originalRecipe.servings,
        imageUrl: originalRecipe.imageUrl,
        url: originalRecipe.url,
        tags: originalRecipe.tags
      };
      
      const userId = currentUser.value?.username;
      const identityId = await getOwnerId();
      
      // For a processed recipe, bypass the Step Function workflow
      // by directly creating it with SUCCESS status
      if (isProcessed) {
        const processedRecipe = {
          ...recipeCopy,
          status: "SUCCESS",
          nutritionalInformation: {
            ...recipeCopy.nutritionalInformation,
            status: "SUCCESS"
          },
          owners: userId ? [userId] : (identityId ? [identityId] : []),
          createdBy: identityId || "",
        };
        
        const authOptions = await getAuthOptions();
        const response = await client.models.Recipe.create(
          processedRecipe,
          authOptions
        );
        
        const recipe = Array.isArray(response?.data)
          ? response.data[0]
          : response?.data;
        
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
      console.error("Error copying recipe:", error);
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
        throw new Error("No ingredients provided");
      }
      
      // Format ingredients for the API request
      const formattedIngredients = ingredients.map(ingredient => {
        // Handle quantity: don't convert "0" to empty string, but keep truly empty values empty
        let quantityValue = "";
        if (ingredient.quantity !== undefined && ingredient.quantity !== null) {
          // If we have a quantity value and it's not "0", use it
          if (ingredient.quantity !== "0" && ingredient.quantity !== 0) {
            quantityValue = String(ingredient.quantity);
          }
          // If it's "0", we'll leave it as empty string
        }
        
        // Handle unit: ensure blank units stay blank
        let unitValue = "";
        if (ingredient.unit) {
          // If unit is an object (from the USelectMenu), extract its value
          if (typeof ingredient.unit === 'object' && ingredient.unit !== null) {
            unitValue = ingredient.unit.value || "";
          } else {
            unitValue = String(ingredient.unit);
          }
        }
        
        return {
          name: ingredient.name.trim().toLowerCase(),
          quantity: quantityValue,
          unit: unitValue
        };
      });
      
      // Get current page URL for partner linkback
      const currentUrl = window.location.href;
      
      // Use the Amplify API client for POST request with credentials
      const restOperation = post({
        apiName: 'instacartApi',
        path: '/instacart/generate-url',
        options: {
          body: {
            ingredients: formattedIngredients,
            title: recipeData?.title || "My Recipe",
            instructions: recipeData?.instructions || [],
            imageUrl: recipeData?.imageUrl || "",
            partnerLinkbackUrl: currentUrl
          },
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      });

      const { body } = await restOperation.response;
      const response = await body.json();
      
      console.log('POST call succeeded');
      console.log(response);
      
      // In compliance with Instacart terms, we don't store any user data
      // beyond the URL and basic information needed for UI feedback
      return {
        url: response.url,
        ingredients: response.ingredients,
        expiresAt: response.expiresAt
      };
    } catch (error: any) {
      console.log('POST call failed: ', error);
      if (error.response) {
        try {
          console.log('Error details: ', JSON.parse(await error.response.body.text()));
        } catch (e) {
          console.log('Could not parse error body');
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
        console.log("No recipes to delete");
        return true; // No recipes to delete is a successful state
      }
      
      console.log(`Deleting ${recipes.length} recipes for account deletion`);
      
      // Get auth options with ownership context
      const authOptions = await getAuthOptions({ requiresOwnership: true });
      
      // Delete each recipe
      const deletePromises = recipes.map(async (recipe) => {
        try {
          await client.models.Recipe.delete({
            id: recipe.id
          }, authOptions);
          
          return true;
        } catch (error) {
          console.error(`Error deleting recipe ${recipe.id}:`, error);
          return false;
        }
      });
      
      // Wait for all delete operations to complete
      const results = await Promise.all(deletePromises);
      
      // Check if all operations were successful
      const allSuccessful = results.every(result => result === true);
      
      // Clear local state
      recipesState.value = {};
      savedRecipesState.value = [];
      myRecipesState.value = [];
      
      return allSuccessful;
    } catch (error) {
      console.error("Error in deleteAllRecipes:", error);
      throw error;
    }
  }

  return {
    recipesState,
    savedRecipesState,
    myRecipesState,
    recipeTags,
    updateRecipe,
    createRecipe,
    getRecipeById,
    getSavedRecipes,
    getMyRecipes,
    scaleIngredients,
    saveRecipe,
    unsaveRecipe,
    copyRecipe,
    generateInstacartUrl,
    deleteAllRecipes
  };
}
