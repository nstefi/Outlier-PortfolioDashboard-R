import type { Express } from "express";
import { createServer, type Server } from "http";
import yahoo from "yahoo-finance2";

// Log initialization
console.log("Financial dashboard API routes initializing");

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Financial API routes
  app.get("/api/stocks/quote/:symbol", async (req, res) => {
    try {
      const symbol = req.params.symbol;
      const result = await yahoo.quote(symbol);
      res.json(result);
    } catch (error) {
      console.error(`Error fetching quote for ${req.params.symbol}:`, error);
      res.status(500).json({ error: "Failed to fetch stock quote" });
    }
  });

  app.get("/api/stocks/quotes", async (req, res) => {
    try {
      const symbols = (req.query.symbols as string)?.split(",") || [];
      if (symbols.length === 0) {
        return res.status(400).json({ error: "No symbols provided" });
      }
      
      const quotes = await yahoo.quote(symbols);
      res.json(Array.isArray(quotes) ? quotes : [quotes]);
    } catch (error) {
      console.error("Error fetching multiple quotes:", error);
      res.status(500).json({ error: "Failed to fetch stock quotes" });
    }
  });

  app.get("/api/stocks/chart/:symbol", async (req, res) => {
    try {
      const symbol = req.params.symbol;
      const period = req.query.period as string || "1d";
      const intervalParam = req.query.interval as string || "1h";
      
      // Define valid interval types
      type ValidInterval = "1d" | "5d" | "1mo" | "3mo" | "1h" | "1m" | "2m" | "5m" | "15m" | "30m" | "60m" | "90m" | "1wk";
      
      // Default to 1h if not a valid interval
      let interval: ValidInterval = "1h";
      
      // Check if the interval is valid
      if (intervalParam === "1d" || intervalParam === "5d" || 
          intervalParam === "1mo" || intervalParam === "3mo" || 
          intervalParam === "1h" || intervalParam === "1m" || 
          intervalParam === "2m" || intervalParam === "5m" || 
          intervalParam === "15m" || intervalParam === "30m" || 
          intervalParam === "60m" || intervalParam === "90m" || 
          intervalParam === "1wk") {
        interval = intervalParam as ValidInterval;
      }
      
      const queryOptions = {
        period1: getStartDateFromPeriod(period),
        interval: interval,
      };
      
      // Get historical data using the chart function
      const result = await yahoo.chart(symbol, queryOptions);
      
      // Ensure the quotes array is populated and has data
      if (!result.quotes || result.quotes.length === 0) {
        console.log("No quotes data available for", symbol, "with period", period);
        
        // Try using historical method as a fallback
        try {
          console.log("Getting real historical data for:", symbol);
          
          // Use Yahoo Finance historical API directly, which has more reliable data
          const historicalOptions = {
            // Always use at least 1 month of historical data to ensure we have enough points
            period1: getStartDateFromPeriod(period === "1d" ? "1mo" : period),
            period2: new Date(), // Now
            interval: "1d" as "1d" // Type assertion to match expected type
          };
          
          const historicalData = await yahoo.historical(symbol, historicalOptions);
          console.log(`Got ${historicalData.length} historical data points for ${symbol}`);
          
          if (historicalData.length === 0) {
            console.error("No historical data available for", symbol);
            return res.status(404).json({ error: "No historical data available" });
          }
          
          // Define the historical data item type
          interface HistoricalDataItem {
            date: Date | string;
            close: number;
            high: number;
            low: number;
            open: number;
            volume: number;
          }
          
          // Transform historical data to chart-friendly format
          const transformedData = {
            meta: result.meta,
            quotes: historicalData.map((item: HistoricalDataItem) => ({
              date: item.date instanceof Date 
                ? item.date.toISOString().split('T')[0] 
                : new Date(item.date).toISOString().split('T')[0],
              close: item.close,
              high: item.high,
              low: item.low,
              open: item.open,
              volume: item.volume
            }))
          };
          
          return res.json(transformedData);
        } catch (fallbackError) {
          console.error("Fallback to historical data failed:", fallbackError);
        }
      }
      
      res.json(result);
    } catch (error) {
      console.error(`Error fetching chart for ${req.params.symbol}:`, error);
      res.status(500).json({ error: "Failed to fetch stock chart data" });
    }
  });

  app.get("/api/stocks/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "No search query provided" });
      }
      
      const results = await yahoo.search(query);
      res.json(results);
    } catch (error) {
      console.error(`Error searching for ${req.query.q}:`, error);
      res.status(500).json({ error: "Failed to search stocks" });
    }
  });
  
  // Add route to get quote for a specific stock
  app.get("/api/stocks/quote/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      console.log(`Getting quote for ${symbol}`);
      
      const quote = await yahoo.quote(symbol);
      
      if (!quote || !quote.regularMarketPrice) {
        return res.status(404).json({ error: "Stock not found or no price data available" });
      }
      
      // Format and return the quote data
      const formattedQuote = {
        symbol: quote.symbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        marketCap: quote.marketCap,
        volume: quote.regularMarketVolume,
        averageVolume: quote.averageDailyVolume3Month,
        longName: quote.longName,
        shortName: quote.shortName,
        open: quote.regularMarketOpen,
        high: quote.regularMarketDayHigh,
        low: quote.regularMarketDayLow,
        previousClose: quote.regularMarketPreviousClose
      };
      
      res.json(formattedQuote);
    } catch (error) {
      console.error(`Error fetching quote for ${req.params.symbol}:`, error);
      res.status(500).json({ error: "Failed to fetch stock quote" });
    }
  });
  
  // API health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "up", time: new Date().toISOString() });
  });
  
  // Fallback route for client-side routing - ensure SPA routes work properly
  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api")) {
      return next();
    }
    
    // Skip direct file requests that should be served by static middleware
    if (req.path.includes(".")) {
      return next();
    }
    
    // Handle error cases - let Vite or the static middleware handle the actual file serving
    next();
  });

  // Helper function to determine start date based on period
  function getStartDateFromPeriod(period: string): Date {
    const now = new Date();
    switch (period) {
      case "1d":
        return new Date(now.setDate(now.getDate() - 1));
      case "5d":
        return new Date(now.setDate(now.getDate() - 5));
      case "1mo":
        return new Date(now.setMonth(now.getMonth() - 1));
      case "3mo":
        return new Date(now.setMonth(now.getMonth() - 3));
      case "6mo":
        return new Date(now.setMonth(now.getMonth() - 6));
      case "1y":
        return new Date(now.setFullYear(now.getFullYear() - 1));
      case "5y":
        return new Date(now.setFullYear(now.getFullYear() - 5));
      default:
        return new Date(now.setDate(now.getDate() - 1));
    }
  }

  return httpServer;
}