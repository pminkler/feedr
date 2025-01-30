import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { recipeUrlEndpoint } from "./functions/recipeUrlEndpoint/resource";
import { Stack } from "aws-cdk-lib";
import { Policy, PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { StartingPosition, EventSourceMapping } from "aws-cdk-lib/aws-lambda";
import { startRecipeProcessing } from "./functions/startRecipeProcessing/resource";

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
