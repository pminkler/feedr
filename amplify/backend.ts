import { defineBackend } from '@aws-amplify/backend';
import { aws_iam, Stack } from 'aws-cdk-lib';
import { Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { StartingPosition, EventSourceMapping } from 'aws-cdk-lib/aws-lambda';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
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

/**
 * Step Functions Setup
 */
const stepFunctionsStack = backend.createStack('StepFunctionsStack');

// ------------------------------
// URL Processing Task (Fetch & Extract)
// ------------------------------
const extractTextFromURLTask = new tasks.LambdaInvoke(stepFunctionsStack, 'Extract Text from URL', {
  lambdaFunction: backend.extractTextFromURL.resources.lambda,
  resultPath: '$.extractedText',
});

// ------------------------------
// Image Processing Task (OCR & Extraction)
// ------------------------------
const extractTextFromImageTask = new tasks.LambdaInvoke(
  stepFunctionsStack,
  'Extract Text from Image',
  {
    lambdaFunction: backend.extractTextFromImage.resources.lambda,
    resultPath: '$.extractedText',
  },
);

// ------------------------------
// Failure Handler: Mark Failure in DynamoDB
// ------------------------------
const markFailureTask = new tasks.LambdaInvoke(stepFunctionsStack, 'Mark Failure', {
  lambdaFunction: backend.markFailure.resources.lambda,
  resultPath: '$.failureResult',
});

// ------------------------------
// Duplicate Tasks for Generate Recipe for each branch
// ------------------------------

// For URL branch:
const generateRecipeTaskURL = new tasks.LambdaInvoke(stepFunctionsStack, 'Generate Recipe (URL)', {
  lambdaFunction: backend.generateRecipe.resources.lambda,
  resultPath: '$.result',
});
generateRecipeTaskURL.addCatch(markFailureTask, { resultPath: '$.error' });

// For Image branch:
const generateRecipeTaskImage = new tasks.LambdaInvoke(
  stepFunctionsStack,
  'Generate Recipe (Image)',
  {
    lambdaFunction: backend.generateRecipe.resources.lambda,
    resultPath: '$.result',
  },
);
generateRecipeTaskImage.addCatch(markFailureTask, { resultPath: '$.error' });

// ------------------------------
// Nutritional Information Task for URL
// ------------------------------
const generateNutritionalInformationTaskURL = new tasks.LambdaInvoke(
  stepFunctionsStack,
  'Generate Nutritional Information (URL)',
  {
    lambdaFunction: backend.generateNutritionalInformation.resources.lambda,
    resultPath: '$.nutritionalInfo',
  },
);
generateNutritionalInformationTaskURL.addCatch(markFailureTask, {
  resultPath: '$.error',
});

// Nutritional Information Task for Image
const generateNutritionalInformationTaskImage = new tasks.LambdaInvoke(
  stepFunctionsStack,
  'Generate Nutritional Information (Image)',
  {
    lambdaFunction: backend.generateNutritionalInformation.resources.lambda,
    resultPath: '$.nutritionalInfo',
  },
);
generateNutritionalInformationTaskImage.addCatch(markFailureTask, {
  resultPath: '$.error',
});

// ------------------------------
// Recipe Image Generation Tasks
// ------------------------------
// Image generation for URL branch
const generateRecipeImageTaskURL = new tasks.LambdaInvoke(
  stepFunctionsStack,
  'Generate Recipe Image (URL)',
  {
    lambdaFunction: backend.generateRecipeImage.resources.lambda,
    resultPath: '$.recipeImage',
  },
);
// Don't fail the Step Function if image generation fails - just continue
generateRecipeImageTaskURL.addCatch(new sfn.Pass(stepFunctionsStack, 'Continue After Image Generation Failure (URL)'), {
  resultPath: '$.imageError',
});

// Image generation for Image branch
const generateRecipeImageTaskImage = new tasks.LambdaInvoke(
  stepFunctionsStack,
  'Generate Recipe Image (Image)',
  {
    lambdaFunction: backend.generateRecipeImage.resources.lambda,
    resultPath: '$.recipeImage',
  },
);
// Don't fail the Step Function if image generation fails - just continue
generateRecipeImageTaskImage.addCatch(new sfn.Pass(stepFunctionsStack, 'Continue After Image Generation Failure (Image)'), {
  resultPath: '$.imageError',
});

// Add error handling for extraction tasks as well.
extractTextFromURLTask.addCatch(markFailureTask, { resultPath: '$.error' });
extractTextFromImageTask.addCatch(markFailureTask, { resultPath: '$.error' });

// ------------------------------
// Build the Branches
// ------------------------------
const processURLChain = sfn.Chain.start(extractTextFromURLTask)
  .next(generateRecipeTaskURL)
  .next(generateNutritionalInformationTaskURL)
  .next(generateRecipeImageTaskURL);

const processImageChain = sfn.Chain.start(extractTextFromImageTask)
  .next(generateRecipeTaskImage)
  .next(generateNutritionalInformationTaskImage)
  .next(generateRecipeImageTaskImage);

// ------------------------------
// Choice State: Determine Input Type
// ------------------------------
const inputChoice = new sfn.Choice(stepFunctionsStack, 'Determine Input Type')
  .when(
    sfn.Condition.and(
      sfn.Condition.isPresent('$.url'),
      sfn.Condition.not(sfn.Condition.stringEquals('$.url', '')),
    ),
    processURLChain,
  )
  .when(sfn.Condition.isPresent('$.pictureSubmissionUUID'), processImageChain)
  .otherwise(
    new sfn.Fail(stepFunctionsStack, 'FailMissingInput', {
      cause: 'No valid input provided (neither url nor pictureSubmissionUUID)',
    }),
  );

// Create the state machine using inputChoice as the definition.
const stateMachine = new sfn.StateMachine(stepFunctionsStack, 'ProcessRecipeStateMachine', {
  definition: inputChoice,
});

// Grant your startRecipeProcessing Lambda permission to start executions of the new state machine.
const statement = new aws_iam.PolicyStatement({
  sid: 'AllowExecutionFromLambda',
  actions: ['states:StartExecution'],
  resources: [stateMachine.stateMachineArn],
});
backend.startRecipeProcessing.resources.lambda.addToRolePolicy(statement);

// Add the state machine ARN to the startRecipeProcessing Lambda environment.
backend.startRecipeProcessing.addEnvironment(
  'ProcessRecipeStepFunctionArn',
  stateMachine.stateMachineArn,
);

// Add environment variables for the generateRecipeImage Lambda
backend.generateRecipeImage.addEnvironment(
  'RECIPE_IMAGES_BUCKET',
  'recipe-images', // Hardcoded bucket name/path instead of using resources
);

// Add a placeholder for the OpenAI API key - this will be set in the Amplify console
backend.generateRecipeImage.addEnvironment(
  'OPENAI_API_KEY',
  process.env.OPENAI_API_KEY || 'PLACEHOLDER_OPENAI_API_KEY',
);

// Add the CDN prefix if needed - this will be configured in the Amplify console if needed
backend.generateRecipeImage.addEnvironment(
  'IMAGE_CDN_PREFIX',
  process.env.IMAGE_CDN_PREFIX || '', // Placeholder to be replaced in console
);

backend.addOutput({
  custom: {
    ProcessRecipeStepFunctionArn: stateMachine.stateMachineArn,
  },
});

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
