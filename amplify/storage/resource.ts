import { defineStorage } from "@aws-amplify/backend";
import { extractTextFromImage } from "../functions/extractTextFromImage/resource";

export const guestPhotoUploadStorage = defineStorage({
  name: "guestPhotoUpload",
  access: (allow) => ({
    "picture-submissions/*": [
      allow.authenticated.to(["read", "write"]),
      allow.guest.to(["read", "write"]),
      allow.resource(extractTextFromImage).to(["read"]),
    ],
  }),
});
