import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { aws_iam, Stack } from "aws-cdk-lib";
import { Policy, PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { StartingPosition, EventSourceMapping } from "aws-cdk-lib/aws-lambda";
import { startRecipeProcessing } from "./functions/startRecipeProcessing/resource";
import { extractTextFromURL } from "./functions/extractTextFromURL/resource";
import { extractTextFromImage } from "./functions/extractTextFromImage/resource";
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
  extractTextFromImage,
  guestPhotoUploadStorage,
});

const textractPolicyStatement = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: ["textract:DetectDocumentText"],
  resources: ["*"], // You can restrict this further if needed.
});
backend.extractTextFromImage.resources.lambda.role?.addToPrincipalPolicy(
  textractPolicyStatement,
);

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
    // The result (e.g. { extractedText: "..." }) is stored at $.extractedText
    resultPath: "$.extractedText",
  },
);

// ------------------------------
// Image Processing Task (Combined OCR & Extraction)
// ------------------------------
const extractTextFromImageTask = new tasks.LambdaInvoke(
  stepFunctionsStack,
  "Extract Text from Image",
  {
    lambdaFunction: backend.extractTextFromImage.resources.lambda,
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

const processImageChain = sfn.Chain.start(extractTextFromImageTask).next(
  generateRecipeTask,
);

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
