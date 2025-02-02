import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { aws_iam, Stack } from "aws-cdk-lib";
import { Policy, PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { StartingPosition, EventSourceMapping } from "aws-cdk-lib/aws-lambda";
import { startRecipeProcessing } from "./functions/startRecipeProcessing/resource";
import { extractTextFromURL } from "./functions/extractTextFromURL/resource";
import { generateRecipe } from "./functions/generateRecipe/resource";
import { guestPhotoUploadStorage } from "./storage/resource";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  startRecipeProcessing,
  generateRecipe,
  extractTextFromURL,
  guestPhotoUploadStorage,
});

const recipeTable = backend.data.resources.tables["Recipe"];
const policy = new Policy(
  Stack.of(recipeTable),
  "StartRecipeProcessingStreamingPolicy",
  {
    statements: [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "dynamodb:GetShardIterator",
          "dynamodb:ListStreams",
        ],
        resources: ["*"],
      }),
    ],
  },
);
backend.startRecipeProcessing.resources.lambda.role?.attachInlinePolicy(policy);

const mapping = new EventSourceMapping(
  Stack.of(recipeTable),
  "StartRecipeProcessingRecipeEventStreamMapping",
  {
    target: backend.startRecipeProcessing.resources.lambda,
    eventSourceArn: recipeTable.tableStreamArn,
    startingPosition: StartingPosition.LATEST,
  },
);

mapping.node.addDependency(policy);

/**
 * Step functions
 */
const stepFunctionsStack = backend.createStack("StepFunctionsStack");

// ------------------------------
// URL Processing Task (Combined Fetch & Extract)
// ------------------------------
const extractTextFromURLTask = new tasks.LambdaInvoke(
  stepFunctionsStack,
  "Extract Text from URL",
  {
    lambdaFunction: backend.extractTextFromURL.resources.lambda,
    // The result (i.e. { extractedText: "..." }) will be stored in $.extractedText
    resultPath: "$.extractedText",
  },
);

// ------------------------------
// Dummy/Placeholder Tasks for Image Processing
// ------------------------------
const performOCRTask = new sfn.Pass(stepFunctionsStack, "Perform OCR", {
  result: sfn.Result.fromObject({ ocrText: "Dummy OCR text" }),
  resultPath: "$.ocrText",
});

const extractTextFromImageTask = new sfn.Pass(
  stepFunctionsStack,
  "Extract Text from Image",
  {
    result: sfn.Result.fromObject({
      extractedText: "Dummy extracted text from image",
    }),
    resultPath: "$.extractedText",
  },
);

// ------------------------------
// Common Task: Generate Recipe (calls your generateRecipe Lambda)
// ------------------------------
const generateRecipeTask = new tasks.LambdaInvoke(
  stepFunctionsStack,
  "Generate Recipe",
  {
    // Updated to use the new generateRecipe function
    lambdaFunction: backend.generateRecipe.resources.lambda,
    resultPath: "$.result",
  },
);

// ------------------------------
// Build the Branches
// ------------------------------
const processURLChain = sfn.Chain.start(extractTextFromURLTask).next(
  generateRecipeTask,
);

const processImageChain = sfn.Chain.start(performOCRTask)
  .next(extractTextFromImageTask)
  .next(generateRecipeTask);

// ------------------------------
// Choice State: Determine Input Type
// ------------------------------
const inputChoice = new sfn.Choice(stepFunctionsStack, "Determine Input Type")
  .when(
    sfn.Condition.and(
      sfn.Condition.isPresent("$.url"),
      sfn.Condition.not(sfn.Condition.stringEquals("$.url", "")),
    ),
    processURLChain,
  )
  .when(sfn.Condition.isPresent("$.pictureSubmissionUUID"), processImageChain)
  .otherwise(
    new sfn.Fail(stepFunctionsStack, "FailMissingInput", {
      cause: "No valid input provided (neither url nor pictureSubmissionUUID)",
    }),
  );

// ------------------------------
// Create the State Machine
// ------------------------------
const stateMachine = new sfn.StateMachine(
  stepFunctionsStack,
  "ProcessRecipeStateMachine",
  {
    definition: inputChoice,
  },
);

// Grant your startRecipeProcessing Lambda permission to start executions of the new state machine
const statement = new aws_iam.PolicyStatement({
  sid: "AllowExecutionFromLambda",
  actions: ["states:StartExecution"],
  resources: [stateMachine.stateMachineArn],
});
backend.startRecipeProcessing.resources.lambda.addToRolePolicy(statement);

backend.startRecipeProcessing.addEnvironment(
  "ProcessRecipeStepFunctionArn",
  stateMachine.stateMachineArn,
);

backend.addOutput({
  custom: {
    ProcessRecipeStepFunctionArn: stateMachine.stateMachineArn,
  },
});
