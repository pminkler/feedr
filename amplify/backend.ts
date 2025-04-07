import { defineBackend } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import { Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { StartingPosition, EventSourceMapping } from 'aws-cdk-lib/aws-lambda';
import { CorsHttpMethod, HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { startRecipeProcessing } from './functions/startRecipeProcessing/resource';
import { extractTextFromURL } from './functions/extractTextFromURL/resource';
import { extractTextFromImage } from './functions/extractTextFromImage/resource';
import { generateRecipe } from './functions/generateRecipe/resource';
import { generateNutritionalInformation } from './functions/generateNutrionalInformation/resource';
import { generateRecipeImage } from './functions/generateRecipeImage/resource';
import { markFailure } from './functions/markFailure/resource';
import { generateInstacartUrl } from './functions/generateInstacartUrl/resource';
import { sendFeedbackEmail } from './functions/sendFeedbackEmail/resource';
import { guestPhotoUploadStorage, recipeImagesStorage } from './storage/resource';

// Temporarily commenting out Step Functions imports
// import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
// import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
// import { aws_iam } from 'aws-cdk-lib';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  startRecipeProcessing,
  generateRecipe,
  generateNutritionalInformation,
  generateRecipeImage,
  extractTextFromURL,
  extractTextFromImage,
  generateInstacartUrl,
  guestPhotoUploadStorage,
  recipeImagesStorage,
  markFailure,
  sendFeedbackEmail,
});

// Allow the extractTextFromImage Lambda to call Textract
const textractPolicyStatement = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: ['textract:DetectDocumentText'],
  resources: ['*'], // You can restrict this further if needed.
});
backend.extractTextFromImage.resources.lambda.role?.addToPrincipalPolicy(textractPolicyStatement);

// Allow the generateRecipeImage Lambda to access S3
const s3PolicyStatement = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    's3:PutObject',
    's3:PutObjectAcl',
    's3:GetObject',
    's3:ListBucket',
  ],
  resources: ['*'], // You can restrict this to specific buckets if needed
});
backend.generateRecipeImage.resources.lambda.role?.addToPrincipalPolicy(s3PolicyStatement);

const recipeTable = backend.data.resources.tables['Recipe'];
// Ensure recipeTable is not undefined before using it
if (recipeTable) {
  const policy = new Policy(Stack.of(recipeTable), 'StartRecipeProcessingStreamingPolicy', {
    statements: [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'dynamodb:DescribeStream',
          'dynamodb:GetRecords',
          'dynamodb:GetShardIterator',
          'dynamodb:ListStreams',
        ],
        resources: ['*'],
      }),
    ],
  });
  backend.startRecipeProcessing.resources.lambda.role?.attachInlinePolicy(policy);

  const mapping = new EventSourceMapping(
    Stack.of(recipeTable),
    'StartRecipeProcessingRecipeEventStreamMapping',
    {
      target: backend.startRecipeProcessing.resources.lambda,
      eventSourceArn: recipeTable.tableStreamArn,
      startingPosition: StartingPosition.LATEST,
    },
  );
  mapping.node.addDependency(policy);
}

// TEMPORARILY COMMENTING OUT STEP FUNCTION CONFIGURATION
// TO RESOLVE CIRCULAR DEPENDENCIES
// Will implement this separately after core functionality is working

// NOTE: Because we've temporarily removed the Step Function definition,
// our Lambda function will not be triggered automatically.
// This is a temporary solution to get the deployment working.

// TODO: Re-implement Step Function once core functionality is working
/*
const stepFunctionsStack = backend.createStack('StepFunctions');

// Step Function definition code was here
*/

// Add placeholder environment variable for the Lambda
backend.startRecipeProcessing.addEnvironment(
  'ProcessRecipeStepFunctionArn',
  'PLACEHOLDER-TO-BE-UPDATED-LATER',
);

// Create a new API stack
const apiStack = backend.createStack('api-stack');

// Create a new HTTP Lambda integration
const httpLambdaIntegration = new HttpLambdaIntegration(
  'InstacartLambdaIntegration',
  backend.generateInstacartUrl.resources.lambda,
);

// Create a new HTTP API
const httpApi = new HttpApi(apiStack, 'HttpApi', {
  apiName: 'instacartApi',
  corsPreflight: {
    // CORS settings
    allowMethods: [
      CorsHttpMethod.GET,
      CorsHttpMethod.POST,
      CorsHttpMethod.PUT,
      CorsHttpMethod.DELETE,
      CorsHttpMethod.OPTIONS,
    ],
    allowOrigins: [
      'https://feedr.app',
      'https://www.feedr.app',
      'https://dev.feedr.app',
      'https://develop.feedr.app',
      'http://localhost:3000',
    ],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Amz-Date',
      'X-Api-Key',
      'X-Amz-Security-Token',
      'X-Amz-User-Agent',
    ],
    allowCredentials: true,
  },
  createDefaultStage: true,
});

// Add routes to the API
httpApi.addRoutes({
  path: '/instacart/generate-url',
  methods: [HttpMethod.POST],
  integration: httpLambdaIntegration,
});

// Add the options method to the route explicitly
httpApi.addRoutes({
  path: '/instacart/generate-url',
  methods: [HttpMethod.OPTIONS],
  integration: httpLambdaIntegration,
});

// Create a new IAM policy to allow Invoke access to the API
const apiPolicy = new Policy(apiStack, 'ApiPolicy', {
  statements: [
    new PolicyStatement({
      actions: ['execute-api:Invoke'],
      resources: [`${httpApi.arnForExecuteApi('*', '/instacart/generate-url')}`],
    }),
  ],
});

// Attach the policy to the authenticated and unauthenticated IAM roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(apiPolicy);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(apiPolicy);

// Configure Feedback DynamoDB stream to trigger sendFeedbackEmail Lambda
const feedbackTable = backend.data.resources.tables['Feedback'];
// Ensure feedbackTable is not undefined before using it
if (feedbackTable) {
  const feedbackPolicy = new Policy(Stack.of(feedbackTable), 'SendFeedbackEmailStreamingPolicy', {
    statements: [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'dynamodb:DescribeStream',
          'dynamodb:GetRecords',
          'dynamodb:GetShardIterator',
          'dynamodb:ListStreams',
        ],
        resources: ['*'],
      }),
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      }),
    ],
  });
  backend.sendFeedbackEmail.resources.lambda.role?.attachInlinePolicy(feedbackPolicy);

  const feedbackMapping = new EventSourceMapping(
    Stack.of(feedbackTable),
    'SendFeedbackEmailEventStreamMapping',
    {
      target: backend.sendFeedbackEmail.resources.lambda,
      eventSourceArn: feedbackTable.tableStreamArn,
      startingPosition: StartingPosition.LATEST,
    },
  );
  feedbackMapping.node.addDependency(feedbackPolicy);
}

// Add outputs to the configuration file
backend.addOutput({
  custom: {
    API: {
      [httpApi.httpApiName!]: {
        endpoint: httpApi.url,
        region: Stack.of(httpApi).region,
        apiName: httpApi.httpApiName,
      },
    },
  },
});
