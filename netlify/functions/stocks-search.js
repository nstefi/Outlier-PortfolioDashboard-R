const yahooFinance = require('yahoo-finance2').default;

exports.handler = async function (event, context) {
  try {
    // Get query from the URL parameters
    const query = event.queryStringParameters.query;
    
    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Query is required' }),
      };
    }

    // Search for stocks
    const searchResults = await yahooFinance.search(query);
    
    // Return the data
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchResults),
    };
  } catch (error) {
    console.error('Error searching stocks:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to search stocks',
        message: error.message
      }),
    };
  }
};