// e2e/helpers/mailslurp.ts
import { MailSlurp } from 'mailslurp-client';

/**
 * Creates a configured MailSlurp instance
 * Uses API key from environment variable MAILSLURP_API_KEY
 */
export function createMailSlurpClient(): MailSlurp {
  const apiKey = process.env.MAILSLURP_API_KEY;

  if (!apiKey) {
    throw new Error('MAILSLURP_API_KEY environment variable is required for email tests');
  }

  return new MailSlurp({ apiKey });
}

/**
 * Creates a new email inbox
 * @returns The created inbox with id and email address
 */
export async function createInbox() {
  const mailslurp = createMailSlurpClient();
  return await mailslurp.createInbox();
}

/**
 * Waits for the latest email in a specified inbox
 * @param inboxId The inbox ID to check for emails
 * @param timeout Optional timeout in milliseconds (default: 30000)
 * @returns The email object
 */
export async function waitForLatestEmail(inboxId: string, timeout = 30000) {
  const mailslurp = createMailSlurpClient();
  return await mailslurp.waitForLatestEmail(inboxId, timeout);
}

/**
 * Extracts a verification code from an email body
 * @param emailBody The body of the email containing the verification code
 * @param pattern Regular expression pattern to extract the code (default: 6 digits)
 * @returns The extracted verification code or null if not found
 */
export function extractVerificationCode(emailBody: string, pattern = /(\d{6})/) {
  const match = emailBody.match(pattern);
  return match ? match[1] : null;
}

/**
 * Deletes an inbox by ID
 * @param inboxId The ID of the inbox to delete
 */
export async function deleteInbox(inboxId: string) {
  const mailslurp = createMailSlurpClient();
  await mailslurp.deleteInbox(inboxId);
}
