// functions/extractTextFromURL/index.ts
import type { Handler } from 'aws-lambda';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const handler: Handler = async (event) => {
  // Expect an event with a "url" property
  const { url } = event;
  if (!url) {
    throw new Error('No URL provided in the input.');
  }

  try {
    // Fetch the webpage content
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const html = response.data;

    // Load HTML into Cheerio and extract text from the body
    const $ = cheerio.load(html);
    $('script, svg, footer, img, noscript').remove();

    let extractedText = $('body').text().trim();

    // Optional cleanup: collapse multiple spaces/newlines into a single space.
    extractedText = extractedText.replace(/\s+/g, ' ');

    // Return the extracted text to the state machine
    return { extractedText };
  } catch (error: any) {
    console.error('Error fetching or extracting text from URL:', error);
    throw new Error('Failed to fetch or extract content: ' + error.message);
  }
};
