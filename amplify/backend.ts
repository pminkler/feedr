import { defineBackend, secret } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { recipeUrlEndpoint } from "./functions/recipeUrlEndpoint/resource";
import { aws_iam, Stack } from "aws-cdk-lib";
import { Policy, PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { StartingPosition, EventSourceMapping } from "aws-cdk-lib/aws-lambda";
import { startRecipeProcessing } from "./functions/startRecipeProcessing/resource";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  recipeUrlEndpoint,
  startRecipeProcessing,
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

// Create a single Lambda function for processing recipes
const processRecipeLambda = new lambda.NodejsFunction(
  stepFunctionsStack,
  "ProcessRecipeLambda",
  {
    entry: "amplify/functions/startRecipeProcessing/stepFns/processRecipe.ts",
    runtime: Runtime.NODEJS_22_X,
  },
);

// Define Step Function with a single Lambda step
const processRecipeTask = new tasks.LambdaInvoke(
  stepFunctionsStack,
  "Process Recipe",
  {
    lambdaFunction: processRecipeLambda,
    resultPath: "$.result",
  },
);

// Create Step Function state machine
const stateMachine = new sfn.StateMachine(
  stepFunctionsStack,
  "ProcessRecipeStateMachine",
  {
    definition: processRecipeTask,
  },
);

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

// Output the Step Function ARN for reference
backend.addOutput({
  custom: {
    ProcessRecipeStepFunctionArn: stateMachine.stateMachineArn,
  },
});
