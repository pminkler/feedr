// Simple test for the Instacart URL generation function
// This is just to verify our implementation, it won't be committed

import { handler } from './amplify/functions/generateInstacartUrl/handler';

async function testInstacartAffiliateLinks() {
  // Mock event object that simulates an API Gateway proxy event
  const mockEvent = {
    version: '2.0',
    routeKey: 'POST /instacart/generate-url',
    rawPath: '/instacart/generate-url',
    rawQueryString: '',
    headers: {
      'content-type': 'application/json',
      origin: 'https://feedr.app'
    },
    requestContext: {
      http: {
        method: 'POST'
      }
    },
    body: JSON.stringify({
      ingredients: [
        { name: 'apples', quantity: '3', unit: 'whole' },
        { name: 'sugar', quantity: '1', unit: 'cup' },
        { name: 'flour', quantity: '2', unit: 'cups' }
      ],
      title: 'Test Recipe',
      instructions: ['Step 1: Mix ingredients', 'Step 2: Bake at 350F for 30 minutes'],
      imageUrl: 'https://feedr.app/favicon.svg',
      partnerLinkbackUrl: 'https://feedr.app/recipes/test'
    })
  };

  try {
    // This would normally make a real API call to Instacart, which won't work in this test
    // The purpose is just to verify our code doesn't have syntax errors
    const result = await handler(mockEvent);
    console.log('Function executed (though Instacart API call likely failed)');
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testInstacartAffiliateLinks();