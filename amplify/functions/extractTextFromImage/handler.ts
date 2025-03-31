// functions/extractTextFromImage/index.ts
import type { Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { env } from '$amplify/env/extractTextFromImage';

// Create AWS SDK clients (ensure that your Lambda role has permissions for S3 and Textract)
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const textractClient = new TextractClient({ region: process.env.AWS_REGION });

// Helper function: Convert a stream to a Buffer.
const streamToBuffer = async (stream: any): Promise<Buffer> => {
  // Handle AWS SDK v3's special Readable-like object
  if (typeof stream.transformToByteArray === 'function') {
    const bytes = await stream.transformToByteArray();
    return Buffer.from(bytes);
  }

  // Handle traditional Node.js ReadableStream
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
};

// Sleep helper
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Function to get the S3 object with retry logic
const getS3ResponseWithRetry = async (
  bucket: string,
  key: string,
  maxAttempts: number = 6,
  delayMs: number = 2000
) => {
  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt++;
    try {
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      const response = await s3Client.send(command);
      return response;
    } catch (err: unknown) {
      // Check if error is due to object not found
      if (
        err instanceof Error &&
        (err.name === 'NoSuchKey' || ('Code' in err && err.Code === 'NoSuchKey'))
      ) {
        if (attempt < maxAttempts) {
          console.warn(`Attempt ${attempt} failed with NoSuchKey. Retrying in ${delayMs}ms...`);
          await sleep(delayMs);
          continue;
        } else {
          throw err;
        }
      } else {
        // For other errors, just throw
        throw err;
      }
    }
  }
  throw new Error('Failed to retrieve S3 object after multiple attempts.');
};

export const handler: Handler = async (event) => {
  // Expect event to include pictureSubmissionUUID.
  const { pictureSubmissionUUID } = event;
  if (!pictureSubmissionUUID) {
    throw new Error('Missing pictureSubmissionUUID in input.');
  }

  // Retrieve the S3 bucket name from the environment variable.
  const bucket = env.GUEST_PHOTO_UPLOAD_BUCKET_NAME;
  if (!bucket) {
    throw new Error('GUEST_PHOTO_UPLOAD_BUCKET_NAME environment variable is not set.');
  }

  // Construct the S3 object key. (Assumes a pattern like 'picture-submissions/<pictureSubmissionUUID>')
  const key = `picture-submissions/${pictureSubmissionUUID}`;

  // Download the image from S3 with retry logic.
  const s3Response = await getS3ResponseWithRetry(bucket, key);
  if (!s3Response.Body) {
    throw new Error('Failed to retrieve the object from S3.');
  }

  const imageBytes = await streamToBuffer(s3Response.Body);

  // Call Textract to perform OCR on the image.
  const textractCommand = new DetectDocumentTextCommand({
    Document: { Bytes: imageBytes },
  });
  const textractResponse = await textractClient.send(textractCommand);

  // Concatenate the text from all LINE blocks.
  const extractedText = (textractResponse.Blocks || [])
    .filter((block) => block.BlockType === 'LINE' && block.Text)
    .map((block) => block.Text)
    .join(' ');

  if (!extractedText) {
    throw new Error('No text was extracted from the image.');
  }

  return { extractedText };
};
