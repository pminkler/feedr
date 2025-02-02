import { defineStorage } from "@aws-amplify/backend";

export const guestPhotoUploadStorage = defineStorage({
  name: "guestPhotoUpload",
  access: (allow) => ({
    "picture-submissions/*": [
      allow.authenticated.to(["read", "write"]),
      allow.guest.to(["read", "write"]),
    ],
  }),
});
