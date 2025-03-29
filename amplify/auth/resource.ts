import { defineAuth, secret } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'Verify your Feedr account',
      verificationEmailBody: (createCode) =>
        `Welcome to Feedr! 

Your verification code is: ${createCode()}

Please enter this code to complete your registration and start exploring recipes.

The Feedr Team`,
    },
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        scopes: ['email'],
        attributeMapping: {
          email: 'email',
        },
      },
      callbackUrls: [
        'http://localhost:3000',
        'https://feedr.app',
        'https://www.feedr.app',
        'https://develop.feedr.app',
      ],
      logoutUrls: [
        'http://localhost:3000/logout',
        'https://feedr.app/logout',
        'https://www.feedr.app/logout',
        'https://develop.feedr.app/logout',
      ],
    },
  },
});
