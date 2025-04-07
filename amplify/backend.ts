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
  // Create the policy in the processing stack to avoid circular dependencies
  const processingStack = Stack.of(backend.startRecipeProcessing.resources.lambda);

  const policy = new Policy(processingStack, 'StartRecipeProcessingStreamingPolicy', {
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

  // Create the event source mapping in the processing stack instead of the data stack
  const mapping = new EventSourceMapping(
    processingStack,
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
 *
 * To resolve circular dependency issues, we're organizing our resources as follows:
 *
 * 1. startRecipeProcessing function is in its own 'processing' stack
 * 2. Step Functions state machine is created in a standalone 'stepFunctions' stack
 * 3. All other Lambda functions that process recipe data are in the 'data' resource group
 *
 * This organization prevents circular dependencies by separating resources with
 * interdependencies into different stacks.
 */
// Create a dedicated stack for Step Functions
const stepFunctionsStack = backend.createStack('stepFunctions');

/**
 * This approach helps avoid circular dependencies by not creating
 * implicit dependencies between nested stacks.
 */

// Get Lambda function references first to reduce complexity
const extractTextURLLambda = backend.extractTextFromURL.resources.lambda;
const extractTextImageLambda = backend.extractTextFromImage.resources.lambda;
const generateRecipeLambda = backend.generateRecipe.resources.lambda;
const generateNutritionLambda = backend.generateNutritionalInformation.resources.lambda;
const generateImageLambda = backend.generateRecipeImage.resources.lambda;
const markFailureLambda = backend.markFailure.resources.lambda;

// Create Step Function tasks for Lambda invocations
const extractTextFromURLTask = new tasks.LambdaInvoke(stepFunctionsStack, 'ExtractTextFromURL', {
  lambdaFunction: extractTextURLLambda,
  resultPath: '$.extractedText',
});

const extractTextFromImageTask = new tasks.LambdaInvoke(stepFunctionsStack, 'ExtractTextFromImage', {
  lambdaFunction: extractTextImageLambda,
  resultPath: '$.extractedText',
});

const markFailureTask = new tasks.LambdaInvoke(stepFunctionsStack, 'MarkFailure', {
  lambdaFunction: markFailureLambda,
  resultPath: '$.failureResult',
});

// Generate Recipe tasks
const generateRecipeTaskURL = new tasks.LambdaInvoke(stepFunctionsStack, 'GenerateRecipeURL', {
  lambdaFunction: generateRecipeLambda,
  resultPath: '$.result',
});

const generateRecipeTaskImage = new tasks.LambdaInvoke(stepFunctionsStack, 'GenerateRecipeImage', {
  lambdaFunction: generateRecipeLambda,
  resultPath: '$.result',
});

// Nutritional Information tasks
const generateNutritionalInformationTaskURL = new tasks.LambdaInvoke(
  stepFunctionsStack,
  'GenerateNutritionalInfoURL',
  {
    lambdaFunction: generateNutritionLambda,
    resultPath: '$.nutritionalInfo',
  },
);

const generateNutritionalInformationTaskImage = new tasks.LambdaInvoke(
  stepFunctionsStack,
  'GenerateNutritionalInfoImage',
  {
    lambdaFunction: generateNutritionLambda,
    resultPath: '$.nutritionalInfo',
  },
);

// Recipe Image Generation tasks
const generateRecipeImageTaskURL = new tasks.LambdaInvoke(
  stepFunctionsStack,
  'GenerateRecipeImageURL',
  {
    lambdaFunction: generateImageLambda,
    resultPath: '$.recipeImage',
  },
);

const generateRecipeImageTaskImage = new tasks.LambdaInvoke(
  stepFunctionsStack,
  'GenerateRecipeImageFromImage',
  {
    lambdaFunction: generateImageLambda,
    resultPath: '$.recipeImage',
  },
);

// Add catch handlers
extractTextFromURLTask.addCatch(markFailureTask, { resultPath: '$.error' });
extractTextFromImageTask.addCatch(markFailureTask, { resultPath: '$.error' });
generateRecipeTaskURL.addCatch(markFailureTask, { resultPath: '$.error' });
generateRecipeTaskImage.addCatch(markFailureTask, { resultPath: '$.error' });
generateNutritionalInformationTaskURL.addCatch(markFailureTask, { resultPath: '$.error' });
generateNutritionalInformationTaskImage.addCatch(markFailureTask, { resultPath: '$.error' });

// For image generation tasks, continue on error instead of failing
const passOnErrorURL = new sfn.Pass(stepFunctionsStack, 'ContinueAfterImageGenerationErrorURL');
const passOnErrorImage = new sfn.Pass(stepFunctionsStack, 'ContinueAfterImageGenerationErrorImage');
generateRecipeImageTaskURL.addCatch(passOnErrorURL, { resultPath: '$.imageError' });
generateRecipeImageTaskImage.addCatch(passOnErrorImage, { resultPath: '$.imageError' });

// Define the workflow chains
const processURLChain = sfn.Chain.start(extractTextFromURLTask)
  .next(generateRecipeTaskURL)
  .next(generateNutritionalInformationTaskURL)
  .next(generateRecipeImageTaskURL);

const processImageChain = sfn.Chain.start(extractTextFromImageTask)
  .next(generateRecipeTaskImage)
  .next(generateNutritionalInformationTaskImage)
  .next(generateRecipeImageTaskImage);

// Create the choice state to determine processing path
const inputChoice = new sfn.Choice(stepFunctionsStack, 'DetermineInputType')
  .when(
    sfn.Condition.and(
      sfn.Condition.isPresent('$.url'),
      sfn.Condition.not(sfn.Condition.stringEquals('$.url', '')),
    ),
    processURLChain,
  )
  .when(
    sfn.Condition.isPresent('$.pictureSubmissionUUID'),
    processImageChain,
  )
  .otherwise(
    new sfn.Fail(stepFunctionsStack, 'MissingInput', {
      cause: 'No valid input provided (neither url nor pictureSubmissionUUID)',
    }),
  );

// Create the state machine
const stateMachine = new sfn.StateMachine(stepFunctionsStack, 'ProcessRecipeStateMachine', {
  definition: inputChoice,
});

// Grant permission to start executions - added to the processing stack
const stepFunctionPermission = new aws_iam.PolicyStatement({
  actions: ['states:StartExecution'],
  resources: [stateMachine.stateMachineArn],
});
backend.startRecipeProcessing.resources.lambda.addToRolePolicy(stepFunctionPermission);

// Add the state machine ARN to environment
backend.startRecipeProcessing.addEnvironment(
  'ProcessRecipeStepFunctionArn',
  stateMachine.stateMachineArn,
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
