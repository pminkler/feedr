# Send Feedback Email Function

This Lambda function sends email notifications when new feedback items are submitted in the application.

## Features

- Triggered automatically when a new Feedback item is created in DynamoDB
- Sends detailed email notification to support@feedr.app
- Uses Amazon SES in the us-east-1 region
- Includes both HTML and plain text email formats
- Email includes all feedback details: ID, email, type, and message

## Prerequisites

- Amazon SES must be configured with feedr.app domain
- The email address support@feedr.app must be verified in SES
- SES must be in production mode (out of sandbox)

## Email Template

- The email includes a nicely formatted HTML version with styling
- A text version is also included for email clients that don't support HTML
- Subject format: `[Feedr Feedback] New {FEEDBACK_TYPE} from {USER_EMAIL}`

## Implementation Details

- Uses DynamoDB Streams to capture new Feedback items
- Configured as an EventSourceMapping in the Amplify backend
- Only processes INSERT events (new feedback submissions)
- Automatically extracts feedback details from the DynamoDB stream event