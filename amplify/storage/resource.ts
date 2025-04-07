import { defineStorage } from '@aws-amplify/backend';
import { extractTextFromImage } from '../functions/extractTextFromImage/resource';
import { generateRecipeImage } from '../functions/generateRecipeImage/resource';

export const guestPhotoUploadStorage = defineStorage({
  name: 'guestPhotoUpload',
  isDefault: true, // Set this as the default storage
  access: (allow) => ({
    'picture-submissions/*': [
      allow.authenticated.to(['read', 'write']),
      allow.guest.to(['read', 'write']),
      allow.resource(extractTextFromImage).to(['read']),
    ],
  }),
});

export const recipeImagesStorage = defineStorage({
  name: 'recipeImages',
  access: (allow) => ({
    'recipe-images/*': [
      allow.guest.to(['read']), // Public read access using guest
      allow.authenticated.to(['read']), // Read access for authenticated users
      allow.resource(generateRecipeImage).to(['read', 'write']),
    ],
  }),
});
