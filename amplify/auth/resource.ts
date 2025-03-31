import { defineAuth, secret } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 *
 * NOTE: To use the custom sender email address (support@feedr.app),
 * you must verify this email in Amazon SES (Simple Email Service)
 * and configure your Cognito User Pool to use SES for sending emails.
 * See: https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-email.html
 */
export const auth = defineAuth({
  // senders: {
  //   email: {
  //     fromEmail: 'support@feedr.app',
  //     fromName: 'Feedr Support',
  //     replyTo: 'support@feedr.app',
  //   },
  // },
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'Verify your Feedr account',
      verificationEmailBody: (createCode) => {
        const code = createCode();
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Verify your Feedr account</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h2 style="color: #4a5568;">Welcome to Feedr!</h2>
  </div>
  
  <p>Your verification code is:</p>
  
  <div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 15px; margin: 20px 0; text-align: center;">
    <span style="font-size: 24px; font-weight: bold; letter-spacing: 3px;">${code}</span>
  </div>
  
  <p>Please enter this code to complete your registration and start exploring recipes.</p>
  
  <p style="margin-top: 30px;">Thank you,<br>The Feedr Team</p>
</body>
</html>`;
      },
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
        'http://localhost:3000/my-recipes',
        'https://feedr.app/my-recipes',
        'https://www.feedr.app/my-recipes',
        'https://develop.feedr.app/my-recipes',
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
