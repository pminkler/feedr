// functions/extractTextFromImage/index.ts
import { Handler } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import {
  TextractClient,
  DetectDocumentTextCommand,
} from "@aws-sdk/client-textract";
import { env } from "$amplify/env/extractTextFromImage";

// Create AWS SDK clients (ensure that your Lambda role has permissions for S3 and Textract)
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const textractClient = new TextractClient({ region: process.env.AWS_REGION });

// Helper function: Convert a stream to a Buffer.
const streamToBuffer = async (stream: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
};

export const handler: Handler = async (event) => {
  // Expect event to include pictureSubmissionUUID.
  const { pictureSubmissionUUID } = event;
  if (!pictureSubmissionUUID) {
    throw new Error("Missing pictureSubmissionUUID in input.");
  }

  // Retrieve the S3 bucket name from the environment variable.
  const bucket = env.GUEST_PHOTO_UPLOAD_BUCKET_NAME;
  if (!bucket) {
    throw new Error(
      "GUEST_PHOTO_UPLOAD_BUCKET_NAME environment variable is not set.",
    );
  }

  // Construct the S3 object key. (Assumes a pattern like 'picture-submissions/<pictureSubmissionUUID>')
  const key = `picture-submissions/${pictureSubmissionUUID}`;

  // Download the image from S3.
  const getObjectCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
  const s3Response = await s3Client.send(getObjectCommand);

  if (!s3Response.Body) {
    throw new Error("Failed to retrieve the object from S3.");
  }

  const imageBytes = await streamToBuffer(s3Response.Body);

  // Call Textract to perform OCR on the image.
  const textractCommand = new DetectDocumentTextCommand({
    Document: { Bytes: imageBytes },
  });
  const textractResponse = await textractClient.send(textractCommand);

  // Concatenate the text from all LINE blocks.
  const extractedText = (textractResponse.Blocks || [])
    .filter((block) => block.BlockType === "LINE" && block.Text)
    .map((block) => block.Text)
    .join(" ");

  if (!extractedText) {
    throw new Error("No text was extracted from the image.");
  }

  return { extractedText };
};
