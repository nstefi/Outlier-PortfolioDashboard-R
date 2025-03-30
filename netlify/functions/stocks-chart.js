const yahooFinance = require('yahoo-finance2').default;

exports.handler = async function (event, context) {
  try {
    // Get symbol and period from the URL parameters
    const pathSegments = event.path.split('/');
    const symbol = pathSegments[pathSegments.length - 1];
    
    // Parse query parameters
    const params = new URLSearchParams(event.queryStringParameters);
    const period = params.get('period') || '1d';
    
    if (!symbol) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Symbol is required' }),
      };
    }

    // Get historical data
    const queryOptions = {
      period1: getStartDate(period),
      interval: mapPeriodToInterval(period),
    };

    const result = await yahooFinance.chart(symbol, queryOptions);
    
    // Return the data
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error fetching chart data:', error);
    
    // Try to get historical data as fallback
    try {
      const pathSegments = event.path.split('/');
      const symbol = pathSegments[pathSegments.length - 1];
      const params = new URLSearchParams(event.queryStringParameters);
      const period = params.get('period') || '1d';
      
      const queryOptions = {
        period1: getStartDate(period),
        period2: new Date(),
      };
      
      const result = await yahooFinance.historical(symbol, queryOptions);
      
      // Format the historical data to match the chart format
      const formattedResult = {
        quotes: result.map(item => ({
          date: item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
        })),
      };
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedResult),
      };
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to fetch chart data',
          message: error.message
        }),
      };
    }
  }
};

function getStartDate(period) {
  const today = new Date();
  switch (period) {
    case '1d':
      return new Date(today.setDate(today.getDate() - 1));
    case '5d':
      return new Date(today.setDate(today.getDate() - 5));
    case '1mo':
      return new Date(today.setMonth(today.getMonth() - 1));
    case '3mo':
      return new Date(today.setMonth(today.getMonth() - 3));
    case '6mo':
      return new Date(today.setMonth(today.getMonth() - 6));
    case '1y':
      return new Date(today.setFullYear(today.getFullYear() - 1));
    case '5y':
      return new Date(today.setFullYear(today.getFullYear() - 5));
    default:
      return new Date(today.setMonth(today.getMonth() - 1)); // Default to 1 month
  }
}

function mapPeriodToInterval(period) {
  switch (period) {
    case '1d': return '5m';
    case '5d': return '15m';
    case '1mo': return '1d';
    case '3mo': return '1d';
    case '6mo': return '1d';
    case '1y': return '1wk';
    case '5y': return '1mo';
    default: return '1d';
  }
}