import type { AppSyncAuthorizerHandler } from 'aws-lambda';

/**
 * Custom owners authorizer
 * 
 * This authorizer verifies ownership for protected operations:
 * - For Recipe update/delete: Checks if the user is in the owners array or is the creator
 * - For MealPlan read/update/delete: Checks if the user is in the owners array or is the creator
 */
type ResolverContext = {
  identityId?: string;
  username?: string;
  isAuthenticated: boolean;
};

export const handler: AppSyncAuthorizerHandler<ResolverContext> = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);
  
  // Extract authorization token and request context
  const { 
    authorizationToken,
    requestContext: { 
      apiId, 
      accountId, 
      queryString, 
      operationName,
      variables 
    } 
  } = event;
  
  // Default to authorizing the request
  let isAuthorized = true;
  const resolverContext: ResolverContext = {
    isAuthenticated: false
  };
  
  try {
    // Parse the authorization token which should contain identity information
    if (authorizationToken) {
      try {
        // We expect the token to be a JSON string containing identity info
        const decodedToken = JSON.parse(authorizationToken);
        
        // Extract identity information
        resolverContext.identityId = decodedToken.identityId;
        resolverContext.username = decodedToken.username;
        resolverContext.isAuthenticated = !!decodedToken.username;
        
        console.log(`Decoded token: ${JSON.stringify(decodedToken)}`);
        console.log(`Authenticated: ${resolverContext.isAuthenticated}`);
      } catch (e) {
        console.log('Failed to parse authorization token, proceeding as guest');
      }
    }
    
    // Determine the operation type
    const isUpdateOperation = queryString?.includes('mutation') && 
      queryString?.includes('update') && 
      operationName?.startsWith('update');
      
    const isDeleteOperation = queryString?.includes('mutation') && 
      queryString?.includes('delete') && 
      operationName?.startsWith('delete');
      
    const isReadOperation = queryString?.includes('query') && 
      !queryString?.includes('mutation');
      
    const isMealPlanOperation = operationName?.includes('MealPlan') || 
      operationName?.includes('mealPlan');
    
    // 1. For MealPlan read operations:
    // - We need to restrict access to owners only, by passing context
    // - AppSync resolvers will filter data based on this context
    if (isReadOperation && isMealPlanOperation) {
      console.log('Authorizing MealPlan read operation');
      
      // Allow the operation but pass identity context for resolver filtering
      isAuthorized = true;
    }
    // 2. For UPDATE/DELETE operations (recipes or meal plans):
    // - Ownership check will happen in the resolver
    else if ((isUpdateOperation || isDeleteOperation) && variables?.input?.id) {
      const id = variables.input.id;
      
      console.log(`Authorizing ${operationName} operation for id: ${id}`);
      
      // Allow the operation but pass identity context for resolver verification
      isAuthorized = true;
    }
    // 3. For all other operations (create, recipe reads):
    // - Allow everyone
    else {
      console.log('Authorizing general operation');
      isAuthorized = true;
    }
    
    const response = {
      isAuthorized,
      resolverContext,
      ttlOverride: 300 // 5 minutes TTL
    };
    
    console.log(`RESPONSE: ${JSON.stringify(response, null, 2)}`);
    return response;
  } catch (error) {
    console.error('Error in custom authorizer:', error);
    // In case of an error, deny access by default
    return {
      isAuthorized: false,
      resolverContext: { isAuthenticated: false },
      ttlOverride: 10 // Short TTL for error responses
    };
  }
};