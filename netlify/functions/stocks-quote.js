const yahooFinance = require('yahoo-finance2').default;

exports.handler = async function (event, context) {
  try {
    // Get symbol from the URL parameters
    const pathSegments = event.path.split('/');
    const symbol = pathSegments[pathSegments.length - 1];
    
    if (!symbol) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Symbol is required' }),
      };
    }

    // Get quote data
    const quote = await yahooFinance.quote(symbol);
    
    // Return the data
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quote),
    };
  } catch (error) {
    console.error('Error fetching quote data:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to fetch quote data',
        message: error.message
      }),
    };
  }
};