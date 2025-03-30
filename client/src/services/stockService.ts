export interface StockQuote {
  symbol: string;
  longName?: string;
  shortName?: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  volume?: number;
  averageVolume?: number;
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
}

export interface StockHistoricalData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PortfolioHolding {
  symbol: string;
  shares: number;
  purchasePrice: number;
  purchaseDate: Date;
}

export interface WatchlistItem {
  symbol: string;
  addedAt: Date;
}

// Default stocks for the dashboard
export const defaultStocks = [
  { symbol: 'AAPL', shortName: 'Apple Inc.', price: 173.75, change: 2.37, changePercent: 1.38 },
  { symbol: 'MSFT', shortName: 'Microsoft', price: 337.22, change: 0.95, changePercent: 0.28 },
  { symbol: 'GOOGL', shortName: 'Alphabet', price: 131.78, change: -0.43, changePercent: -0.32 },
  { symbol: 'AMZN', shortName: 'Amazon', price: 127.12, change: 1.25, changePercent: 0.99 },
  { symbol: 'META', shortName: 'Meta Platforms', price: 301.40, change: 5.12, changePercent: 1.73 },
  { symbol: 'TSLA', shortName: 'Tesla', price: 258.73, change: -4.38, changePercent: -1.66 },
  { symbol: 'NVDA', shortName: 'NVIDIA', price: 425.03, change: 8.74, changePercent: 2.10 },
  { symbol: 'BRK-A', shortName: 'Berkshire Hathaway', price: 496325.00, change: 2087.00, changePercent: 0.42 },
  { symbol: 'NFLX', shortName: 'Netflix', price: 423.99, change: -1.12, changePercent: -0.26 },
  { symbol: 'JPM', shortName: 'JPMorgan Chase', price: 146.43, change: 0.51, changePercent: 0.35 }
];

// Default market indices
export const defaultIndices = [
  { symbol: '^GSPC', name: 'S&P 500', price: 4357.58, change: 24.34, changePercent: 0.56 },
  { symbol: '^DJI', name: 'Dow Jones', price: 34152.60, change: 105.11, changePercent: 0.31 },
  { symbol: '^IXIC', name: 'NASDAQ', price: 13736.81, change: 85.33, changePercent: 0.62 }
];

/**
 * Get current stock quote for a symbol
 */
export async function getStockQuote(symbol: string): Promise<StockQuote> {
  try {
    const response = await fetch(`/api/stocks/quote/${symbol}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Format the response from Yahoo Finance
    const quote = {
      symbol: data.symbol || symbol,
      longName: data.longName || data.shortName || symbol,
      shortName: data.shortName || data.longName || symbol,
      price: data.regularMarketPrice || data.price || 0,
      change: data.regularMarketChange || data.change || 0,
      changePercent: data.regularMarketChangePercent || data.changePercent || 0,
      marketCap: data.marketCap || 0,
      volume: data.regularMarketVolume || data.volume || 0,
      averageVolume: data.averageDailyVolume10Day || data.averageVolume || 0,
      open: data.regularMarketOpen || data.open || 0,
      high: data.regularMarketDayHigh || data.high || 0,
      low: data.regularMarketDayLow || data.low || 0,
      previousClose: data.regularMarketPreviousClose || data.previousClose || 0
    };
    
    return quote;
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    
    // Fallback to default stock if available
    const stock = defaultStocks.find(s => s.symbol === symbol);
    if (stock) {
      console.log('Using default stock data for', symbol);
      return {
        ...stock,
        marketCap: 0,
        volume: 0,
        averageVolume: 0,
        open: stock.price,
        high: stock.price,
        low: stock.price,
        previousClose: stock.price
      };
    }
    
    throw error;
  }
}

/**
 * Get multiple stock quotes
 */
export async function getMultipleStockQuotes(symbols: string[]): Promise<StockQuote[]> {
  try {
    // In a real implementation, this would batch the API requests
    // For demonstration, we'll use our default stocks or generate fake data
    const quotes = await Promise.all(
      symbols.map(async (symbol) => await getStockQuote(symbol))
    );
    
    return quotes;
  } catch (error) {
    console.error('Error fetching multiple stock quotes:', error);
    throw error;
  }
}

/**
 * Get historical stock data for charts
 */
export async function getHistoricalData(
  symbol: string,
  period: string = '1M'
): Promise<StockHistoricalData[]> {
  try {
    // Convert period to Yahoo Finance format
    const mappedPeriod = period.replace('D', 'd').replace('W', 'w').replace('M', 'mo').replace('Y', 'y');
    
    const response = await fetch(`/api/stocks/chart/${symbol}?period=${mappedPeriod}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.timestamps || !data.indicators) {
      // Handle new response format
      if (data.quotes && data.quotes.length > 0) {
        return data.quotes.map((quote: any) => ({
          date: new Date(quote.date),
          open: quote.open,
          high: quote.high,
          low: quote.low,
          close: quote.close,
          volume: quote.volume
        }));
      }
      
      throw new Error('Invalid data format from API');
    }
    
    // Format data from Yahoo Finance
    const timestamps = data.timestamps;
    const quotes = data.indicators.quote[0];
    const chartData: StockHistoricalData[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      if (quotes.open[i] !== null && quotes.close[i] !== null) {
        chartData.push({
          date: new Date(timestamps[i] * 1000), // Convert to milliseconds
          open: quotes.open[i],
          high: quotes.high[i],
          low: quotes.low[i],
          close: quotes.close[i],
          volume: quotes.volume[i]
        });
      }
    }
    
    return chartData;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    
    // Create fallback data if needed
    const startDate = getStartDate(period);
    const endDate = new Date();
    
    // Generate daily data points between start and end dates
    const dailyData = [];
    let currentDate = new Date(startDate);
    let basePrice = 100;
    
    // Trend factors for different periods
    const trendFactor = period === '5Y' ? 0.0002 : 0.0001;
    const volatilityFactor = period === '1D' ? 0.005 : 0.01;
    
    while (currentDate <= endDate) {
      // Skip weekends
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Random walk with trend
        basePrice = basePrice * (1 + (Math.random() - 0.48) * volatilityFactor + trendFactor);
        
        dailyData.push({
          date: new Date(currentDate),
          open: basePrice * (1 - Math.random() * 0.01),
          high: basePrice * (1 + Math.random() * 0.01),
          low: basePrice * (1 - Math.random() * 0.01),
          close: basePrice,
          volume: Math.floor(Math.random() * 10000000)
        });
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log('Using fallback data for', symbol);
    return dailyData;
  }
}

/**
 * Search for stocks by query
 */
export async function searchStocks(query: string): Promise<any[]> {
  try {
    const response = await fetch(`/api/stocks/search?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Format the response from Yahoo Finance
    const results = data.quotes?.map((quote: any) => ({
      symbol: quote.symbol,
      shortName: quote.shortName || quote.longName || quote.symbol,
      longName: quote.longName || quote.shortName || quote.symbol,
      exchange: quote.exchange || '',
      quoteType: quote.quoteType || '',
      price: 0, // We'll fetch prices separately
      change: 0,
      changePercent: 0
    })) || [];
    
    return results;
  } catch (error) {
    console.error('Error searching stocks:', error);
    
    // Fallback to filtering default stocks
    const results = defaultStocks.filter(
      stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        (stock.shortName && stock.shortName.toLowerCase().includes(query.toLowerCase()))
    );
    
    console.log('Using default stocks for search:', query);
    return results;
  }
}

/**
 * Helper to calculate start date based on period
 */
function getStartDate(period: string): Date {
  const today = new Date();
  
  switch (period) {
    case '1D':
      return new Date(today.setDate(today.getDate() - 1));
    case '1W':
      return new Date(today.setDate(today.getDate() - 7));
    case '1M':
      return new Date(today.setMonth(today.getMonth() - 1));
    case '3M':
      return new Date(today.setMonth(today.getMonth() - 3));
    case '6M':
      return new Date(today.setMonth(today.getMonth() - 6));
    case '1Y':
      return new Date(today.setFullYear(today.getFullYear() - 1));
    case '5Y':
      return new Date(today.setFullYear(today.getFullYear() - 5));
    default:
      return new Date(today.setMonth(today.getMonth() - 1));
  }
}

/**
 * Portfolio management functions
 */
export function getPortfolio(): PortfolioHolding[] {
  try {
    const portfolioJson = localStorage.getItem('portfolio');
    if (!portfolioJson) return [];
    
    const portfolio = JSON.parse(portfolioJson);
    return portfolio.map((item: any) => ({
      ...item,
      purchaseDate: new Date(item.purchaseDate)
    }));
  } catch (error) {
    console.error('Error getting portfolio from storage:', error);
    return [];
  }
}

export function savePortfolio(portfolio: PortfolioHolding[]): void {
  try {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
  } catch (error) {
    console.error('Error saving portfolio to storage:', error);
  }
}

export function addToPortfolio(holding: PortfolioHolding): PortfolioHolding[] {
  try {
    const portfolio = getPortfolio();
    
    // Check if we already own this stock
    const existingIndex = portfolio.findIndex(item => item.symbol === holding.symbol);
    
    if (existingIndex >= 0) {
      // Update existing holding (average down/up)
      const existing = portfolio[existingIndex];
      const totalShares = existing.shares + holding.shares;
      const totalCost = (existing.shares * existing.purchasePrice) + (holding.shares * holding.purchasePrice);
      const averagePrice = totalCost / totalShares;
      
      portfolio[existingIndex] = {
        ...existing,
        shares: totalShares,
        purchasePrice: averagePrice,
        purchaseDate: new Date() // Use latest purchase date
      };
    } else {
      // Add new holding
      portfolio.push(holding);
    }
    
    savePortfolio(portfolio);
    return portfolio;
  } catch (error) {
    console.error('Error adding to portfolio:', error);
    return getPortfolio();
  }
}

export function removeFromPortfolio(symbol: string, shares?: number): PortfolioHolding[] {
  try {
    const portfolio = getPortfolio();
    const existingIndex = portfolio.findIndex(item => item.symbol === symbol);
    
    if (existingIndex >= 0) {
      if (!shares || shares >= portfolio[existingIndex].shares) {
        // Remove entire holding
        portfolio.splice(existingIndex, 1);
      } else {
        // Remove partial holding
        portfolio[existingIndex].shares -= shares;
      }
      
      savePortfolio(portfolio);
    }
    
    return portfolio;
  } catch (error) {
    console.error('Error removing from portfolio:', error);
    return getPortfolio();
  }
}

/**
 * Watchlist management functions
 */
export function getWatchlist(): WatchlistItem[] {
  try {
    const watchlistJson = localStorage.getItem('watchlist');
    if (!watchlistJson) return [];
    
    const watchlist = JSON.parse(watchlistJson);
    return watchlist.map((item: any) => ({
      ...item,
      addedAt: new Date(item.addedAt)
    }));
  } catch (error) {
    console.error('Error getting watchlist from storage:', error);
    return [];
  }
}

export function saveWatchlist(watchlist: WatchlistItem[]): void {
  try {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  } catch (error) {
    console.error('Error saving watchlist to storage:', error);
  }
}

export function addToWatchlist(symbol: string): WatchlistItem[] {
  try {
    const watchlist = getWatchlist();
    
    // Check if stock is already in watchlist
    if (!watchlist.some(item => item.symbol === symbol)) {
      watchlist.push({
        symbol,
        addedAt: new Date()
      });
      
      saveWatchlist(watchlist);
    }
    
    return watchlist;
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return getWatchlist();
  }
}

export function removeFromWatchlist(symbol: string): WatchlistItem[] {
  try {
    let watchlist = getWatchlist();
    watchlist = watchlist.filter(item => item.symbol !== symbol);
    saveWatchlist(watchlist);
    return watchlist;
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return getWatchlist();
  }
}

/**
 * Utility functions for financial calculations
 */
export function calculateTotalPortfolioValue(
  holdings: PortfolioHolding[],
  currentPrices: Record<string, number>
): number {
  return holdings.reduce((total, holding) => {
    const currentPrice = currentPrices[holding.symbol] || 0;
    return total + (currentPrice * holding.shares);
  }, 0);
}

export function calculateGainLoss(
  holding: PortfolioHolding,
  currentPrice: number
): { absolute: number; percentage: number } {
  const initialValue = holding.purchasePrice * holding.shares;
  const currentValue = currentPrice * holding.shares;
  const absoluteGainLoss = currentValue - initialValue;
  const percentageGainLoss = initialValue > 0
    ? (absoluteGainLoss / initialValue) * 100
    : 0;
  
  return {
    absolute: absoluteGainLoss,
    percentage: percentageGainLoss
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Format large numbers with abbreviations (K, M, B, T)
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1000000000000) {
    return `$${(value / 1000000000000).toFixed(2)}T`;
  } else if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(2)}B`;
  } else if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}