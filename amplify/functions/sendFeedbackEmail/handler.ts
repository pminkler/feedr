import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const RECIPIENT = 'support@feedr.app';
const SENDER = 'noreply@feedr.app';
const REGION = 'us-east-1';

// Initialize the SES client
const sesClient = new SESClient({ region: REGION });

/**
 * Lambda handler for sending feedback email notifications
 */
export const handler = async (event: {
  Records?: Array<{ eventName?: string; dynamodb?: { NewImage?: Record<string, unknown> } }>;
}) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  try {
    // Check if this is a DynamoDB stream event
    if (!event.Records || !Array.isArray(event.Records)) {
      console.log('Not a valid DynamoDB stream event');
      return { statusCode: 200, body: 'Not a valid DynamoDB stream event' };
    }

    for (const record of event.Records) {
      // Only process new items
      if (record.eventName !== 'INSERT') {
        continue;
      }

      // Get the feedback data from the DynamoDB record
      if (!record.dynamodb) {
        console.log('No dynamodb data in the record');
        continue;
      }

      const feedbackItem = record.dynamodb.NewImage;
      if (!feedbackItem) {
        console.log('No new image in the DynamoDB record');
        continue;
      }

      // Define type for DynamoDB attribute
      interface DynamoDBAttribute {
        S?: string;
        N?: string;
        BOOL?: boolean;
      }

      // Extract feedback details with proper type handling
      const email = (feedbackItem.email as DynamoDBAttribute)?.S || 'Unknown email';
      const message = (feedbackItem.message as DynamoDBAttribute)?.S || 'No message';
      const type = (feedbackItem.type as DynamoDBAttribute)?.S || 'Unknown type';
      const feedbackId = (feedbackItem.id as DynamoDBAttribute)?.S || 'Unknown ID';

      // Format the email
      const emailParams = {
        Destination: {
          ToAddresses: [RECIPIENT],
        },
        Message: {
          Body: {
            Text: {
              Charset: 'UTF-8',
              Data: `
New Feedback Submission

ID: ${feedbackId}
From: ${email}
Type: ${type}

Message:
${message}
              `,
            },
            Html: {
              Charset: 'UTF-8',
              Data: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Feedback Submission</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; width: 90%; margin: 0 auto; padding: 20px; }
    .header { background-color: #f0f0f0; padding: 10px; border-bottom: 1px solid #ddd; }
    .content { padding: 20px 0; }
    .footer { font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
    .feedback-type { display: inline-block; padding: 4px 8px; background-color: #e0f0ff; border-radius: 4px; }
    .message-box { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ddd; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Feedback Submission</h2>
    </div>
    <div class="content">
      <p><strong>ID:</strong> ${feedbackId}</p>
      <p><strong>From:</strong> ${email}</p>
      <p><strong>Type:</strong> <span class="feedback-type">${type}</span></p>
      
      <h3>Message:</h3>
      <div class="message-box">
        ${message.replace(/\n/g, '<br>')}
      </div>
    </div>
    <div class="footer">
      <p>This is an automated message from Feedr.app</p>
    </div>
  </div>
</body>
</html>
              `,
            },
          },
          Subject: {
            Charset: 'UTF-8',
            Data: `[Feedr Feedback] New ${type} from ${email}`,
          },
        },
        Source: SENDER,
      };

      // Send the email
      console.log('Sending email with params:', emailParams);
      const sendEmailCommand = new SendEmailCommand(emailParams);
      const response = await sesClient.send(sendEmailCommand);
      console.log('Email sent successfully:', response);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email notification sent successfully' }),
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error sending email notification', error }),
    };
  }
};
