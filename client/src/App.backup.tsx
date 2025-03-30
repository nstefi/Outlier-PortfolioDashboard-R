import "@fontsource/inter";
import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider, useTheme } from "./lib/ThemeContext";
import PriceChange from "./components/ui/PriceChange";
import { AccessibleStockChart } from "./components/dashboard/AccessibleStockChart";
import { getHistoricalData } from "./services/stockService";

// Dashboard Content component that uses the theme context
// Define stock type for portfolio/watchlist
interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  color: string;
  exchange: string;
  open?: number;
  high?: number;
  low?: number;
  volume?: string;
  selected?: boolean;
  shares?: number;
  purchasePrice?: number;
  purchaseDate?: Date;
}

// Define chart data interface
interface ChartDataPoint {
  date: string;
  value: number;
}

const DashboardContent = () => {
  const { colors } = useTheme();
  const [status, setStatus] = useState<string>("Loading...");
  const [statusType, setStatusType] = useState<string>("neutral");
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("1D");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isChartLoading, setIsChartLoading] = useState<boolean>(false);
  
  // Sample portfolio stocks
  const [stocks, setStocks] = useState<Stock[]>([
    { 
      symbol: "AAPL", 
      name: "Apple Inc.", 
      price: 171.33, 
      change: 1.52, 
      changePercent: 0.89, 
      color: "bg-red-500",
      exchange: "NASDAQ",
      open: 170.10,
      high: 172.45,
      low: 169.88,
      volume: "32.4M",
      selected: true
    },
    { 
      symbol: "TSLA", 
      name: "Tesla Inc.", 
      price: 150.45, 
      change: -2.18, 
      changePercent: -1.43, 
      color: "bg-purple-500",
      exchange: "NASDAQ",
      open: 153.22,
      high: 154.89,
      low: 149.75,
      volume: "28.7M"
    },
    { 
      symbol: "GOOGL", 
      name: "Alphabet Inc.", 
      price: 154.33, 
      change: -7.91, 
      changePercent: -4.88, 
      color: "bg-blue-500",
      exchange: "NASDAQ",
      open: 162.41,
      high: 162.85,
      low: 154.01,
      volume: "22.1M"
    },
    { 
      symbol: "MSFT", 
      name: "Microsoft Corporation", 
      price: 407.12, 
      change: 4.23, 
      changePercent: 1.05, 
      color: "bg-blue-700",
      exchange: "NASDAQ",
      open: 403.25,
      high: 408.55,
      low: 402.77,
      volume: "18.3M"
    },
    { 
      symbol: "AMZN", 
      name: "Amazon.com Inc.", 
      price: 178.95, 
      change: 2.11, 
      changePercent: 1.19, 
      color: "bg-blue-400",
      exchange: "NASDAQ",
      open: 177.25,
      high: 179.60,
      low: 176.88,
      volume: "25.2M"
    },
    { 
      symbol: "NFLX", 
      name: "Netflix Inc.", 
      price: 631.88, 
      change: -3.75, 
      changePercent: -0.59, 
      color: "bg-green-600",
      exchange: "NASDAQ",
      open: 635.44,
      high: 637.12,
      low: 629.55,
      volume: "9.7M"
    },
    { 
      symbol: "SBUX", 
      name: "Starbucks Corporation", 
      price: 92.45, 
      change: -1.17, 
      changePercent: -1.25, 
      color: "bg-yellow-500",
      exchange: "NASDAQ",
      open: 93.78,
      high: 94.22,
      low: 92.11,
      volume: "7.9M"
    }
  ]);

  // Get selected stock
  const selectedStock = stocks.find(stock => stock.selected) || stocks[0];
  
  // Handle stock selection
  const handleSelectStock = (symbol: string) => {
    setStocks(prevStocks => 
      prevStocks.map(stock => ({
        ...stock,
        selected: stock.symbol === symbol
      }))
    );
  };

  // Convert server time range format
  const mapTimeRangeToAPI = (range: string): string => {
    switch (range) {
      case '1D': return '1d';
      case '1W': return '5d';
      case '1M': return '1mo';
      case '3M': return '3mo';
      case '6M': return '6mo';
      case '1Y': return '1y';
      case '5Y': return '5y';
      default: return '1d';
    }
  };

  // Fetch stock chart data
  const fetchChartData = async (symbol: string, range: string) => {
    setIsChartLoading(true);
    try {
      // Use the API endpoint directly
      const apiRange = mapTimeRangeToAPI(range);
      const response = await fetch(`/api/stocks/chart/${symbol}?period=${apiRange}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Chart data response:", data);
      
      // Check if we have quotes data from the historical fallback
      if (data && data.quotes && data.quotes.length > 0) {
        // Format the data for our chart component - from historical quotes
        const formattedData: ChartDataPoint[] = data.quotes
          .filter((quote: any) => quote.close !== null && quote.close !== undefined)
          .map((quote: any) => ({
            date: typeof quote.date === 'string' ? quote.date : new Date(quote.date).toISOString().split('T')[0],
            value: quote.close
          }));
        
        if (formattedData.length > 0) {
          setChartData(formattedData);
          console.log("Formatted chart data:", formattedData);
        } else {
          console.log("No valid price data in the quotes array");
          setChartData([]);
        }
      } 
      // Handle the traditional Yahoo chart format
      else if (data && data.timestamp && data.indicators && data.indicators.quote && data.indicators.quote.length > 0) {
        const quote = data.indicators.quote[0];
        const timestamps = data.timestamp;
        
        // Map the response to our chart data format
        const formattedData: ChartDataPoint[] = timestamps.map((time: number, index: number) => {
          const closePrice = quote.close[index];
          // Skip null values that sometimes appear in the Yahoo API response
          if (closePrice === null) return null;
          
          return {
            date: new Date(time * 1000).toISOString().split('T')[0],
            value: closePrice
          };
        }).filter(Boolean); // Remove null entries
        
        setChartData(formattedData);
        console.log("Formatted chart data:", formattedData);
      } else {
        // Handle empty or invalid response
        console.log("No valid chart data found in response");
        
        // Force a refresh to try the fallback API endpoint
        console.log("Trying API again with fallback mechanism");
        fetch(`/api/stocks/chart/${symbol}?period=${apiRange}&refresh=true`)
          .then(res => res.json())
          .then(fallbackData => {
            console.log("Fallback data:", fallbackData);
            if (fallbackData && fallbackData.quotes && fallbackData.quotes.length > 0) {
              const formattedData = fallbackData.quotes
                .filter((quote: any) => quote.close !== null && quote.close !== undefined)
                .map((quote: any) => ({
                  date: typeof quote.date === 'string' ? quote.date : new Date(quote.date).toISOString().split('T')[0],
                  value: quote.close
                }));
              if (formattedData.length > 0) {
                setChartData(formattedData);
              } else {
                setChartData([]);
              }
            } else {
              setChartData([]);
            }
          })
          .catch(err => {
            console.error("Fallback fetch error:", err);
            setChartData([]);
          });
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
      setChartData([]);
    } finally {
      setIsChartLoading(false);
    }
  };

  // Handle time range selection
  const handleTimeRangeSelect = (range: string) => {
    setSelectedTimeRange(range);
    fetchChartData(selectedStock.symbol, range);
  };
  
  useEffect(() => {
    // Simplified API check with basic fetch
    fetch("/api/health")
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setStatus(`API is up! Server time: ${data.time}`);
        setStatusType("success");
        console.log("API health check successful:", data);
      })
      .catch(error => {
        setStatus(`Error connecting to API: ${error.message}`);
        setStatusType("error");
        console.error("API health check failed:", error);
      });
  }, []);
  
  // Add click outside handler to close settings dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Fetch chart data when stock or time range changes
  useEffect(() => {
    if (selectedStock) {
      fetchChartData(selectedStock.symbol, selectedTimeRange);
    }
  }, [selectedStock?.symbol]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800">
            Portfolio Dashboard
          </h1>
          <div className="relative" ref={settingsRef}>
            <button 
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200"
              title="Settings"
              onClick={() => setShowSettings(!showSettings)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
            
            {showSettings && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-10">
                <div className="p-4">
                  <h3 className="text-sm font-semibold mb-2">API Status</h3>
                  <div 
                    className={`p-3 rounded-md text-sm ${
                      statusType === "success" ? "bg-green-100 text-green-700" : 
                      statusType === "error" ? "bg-red-100 text-red-700" : 
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {status}
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Portfolio Value</h3>
            <div className="text-xl font-semibold">
              ${calculateTotalPortfolioValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-600">Total market value of all holdings</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Shares</h3>
            <div className="text-xl font-semibold">
              {calculateTotalShares()}
            </div>
            <div className="text-sm text-gray-600">Number of shares across all holdings</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Stocks</h3>
            <div className="text-xl font-semibold">{stocks.length}</div>
            <div className="text-sm text-gray-600">Number of unique stocks in portfolio</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Daily Change</h3>
            <div className="text-xl font-semibold flex items-center">
              ${calculateTotalDailyChange().toFixed(2)}
              <span className={`ml-1 text-sm ${calculateTotalDailyChange() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ({calculateTotalDailyChange() >= 0 ? '+' : ''}{calculateTotalDailyChangePercent().toFixed(2)}%)
              </span>
            </div>
            <div className="text-sm text-gray-600">Today's change across portfolio</div>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Side - Watchlist/Portfolio */}
          <div className="lg:w-1/3 bg-white rounded-lg shadow-md">
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center">
                <h2 className="text-lg font-semibold">Portfolio ({stocks.length})</h2>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 text-gray-500 cursor-pointer">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              <button 
                className="flex items-center justify-center h-8 w-8 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                title="Add Stock"
                onClick={() => {
                  const symbol = prompt("Enter a stock symbol to add (e.g., AAPL, MSFT):");
                  if (symbol) {
                    // Check if stock already exists in portfolio
                    if (stocks.some(s => s.symbol === symbol.toUpperCase())) {
                      alert(`${symbol.toUpperCase()} is already in your portfolio.`);
                      return;
                    }
                    
                    // Add the stock to the portfolio
                    const newStock: Stock = {
                      symbol: symbol.toUpperCase(),
                      name: symbol.toUpperCase(),
                      price: 0,
                      change: 0,
                      changePercent: 0,
                      color: "bg-blue-500",
                      exchange: "NASDAQ"
                    };
                    
                    setStocks(prevStocks => [...prevStocks, newStock]);
                    
                    // Fetch the stock data
                    fetch(`/api/stocks/quote/${symbol.toUpperCase()}`)
                      .then(res => res.json())
                      .then(data => {
                        if (data.error) {
                          alert(`Error: ${data.error}`);
                          // Remove the stock if data fetch fails
                          setStocks(prevStocks => prevStocks.filter(s => s.symbol !== symbol.toUpperCase()));
                          return;
                        }
                        
                        // Update the stock with the fetched data
                        setStocks(prevStocks => prevStocks.map(s => 
                          s.symbol === symbol.toUpperCase() 
                            ? { 
                                ...s, 
                                price: data.price || 0,
                                change: data.change || 0,
                                changePercent: data.changePercent || 0,
                                name: data.longName || data.shortName || symbol.toUpperCase()
                              } 
                            : s
                        ));
                      })
                      .catch(err => {
                        console.error("Error fetching stock data:", err);
                        alert("Failed to fetch stock data. Please try again.");
                        // Remove the stock if data fetch fails
                        setStocks(prevStocks => prevStocks.filter(s => s.symbol !== symbol.toUpperCase()));
                      });
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
            
            <div className="px-2">
              <div className="grid grid-cols-5 text-xs font-medium text-gray-500 uppercase tracking-wider p-2">
                <div>Symbol</div>
                <div className="text-right">Last</div>
                <div className="text-right">Shares</div>
                <div className="text-right">Chg</div>
                <div className="text-right">Chg%</div>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(100vh-340px)]">
              {/* Stock List */}
              {stocks.map(stock => (
                <div className="px-2" key={stock.symbol}>
                  <div 
                    className={`grid grid-cols-5 gap-1 p-2 ${
                      stock.selected 
                        ? "bg-gray-100 border border-blue-500 rounded" 
                        : "hover:bg-gray-50"
                    } cursor-pointer`}
                    onClick={() => handleSelectStock(stock.symbol)}
                  >
                    <div className="flex items-center">
                      <span className={`inline-block w-6 h-6 rounded-full ${stock.color} mr-2 text-white text-xs flex items-center justify-center`}>
                        {stock.symbol.charAt(0)}
                      </span>
                      <span className="font-medium">{stock.symbol}</span>
                    </div>
                    <div className="text-right">{stock.price.toFixed(2)}</div>
                    <div className="text-right">{stock.shares || 0}</div>
                    <div className={`text-right ${stock.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {stock.change >= 0 ? "+" : ""}{stock.change.toFixed(2)}
                    </div>
                    <div className={`text-right ${stock.changePercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}

              {/* Actions for selected stock */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex items-center space-x-2">
                  <button 
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    onClick={() => {
                      // Find the currently selected stock
                      const selectedStockItem = stocks.find(s => s.selected);
                      if (!selectedStockItem) {
                        alert("Please select a stock to edit");
                        return;
                      }
                      
                      // Use prompt to get new share count or other properties
                      const shareCount = prompt(
                        `Enter share count for ${selectedStockItem.symbol}:`, 
                        selectedStockItem.shares?.toString() || "0"
                      );
                      
                      if (shareCount === null) return; // User cancelled
                      
                      const newShares = parseInt(shareCount);
                      if (isNaN(newShares) || newShares < 0) {
                        alert("Please enter a valid number of shares");
                        return;
                      }
                      
                      // Update the stock with the new share count
                      setStocks(prevStocks => prevStocks.map(s => 
                        s.symbol === selectedStockItem.symbol 
                          ? { ...s, shares: newShares } 
                          : s
                      ));
                      
                      alert(`Updated ${selectedStockItem.symbol} to ${newShares} shares`);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    onClick={() => {
                      // Find the currently selected stock
                      const selectedStockItem = stocks.find(s => s.selected);
                      if (!selectedStockItem) {
                        alert("Please select a stock to remove");
                        return;
                      }
                      
                      // Confirm deletion
                      if (confirm(`Are you sure you want to remove ${selectedStockItem.symbol} from your portfolio?`)) {
                        // Remove the stock
                        setStocks(prevStocks => prevStocks.filter(s => s.symbol !== selectedStockItem.symbol));
                        
                        // If we deleted the selected stock, select the first remaining stock
                        if (stocks.length > 1) {
                          const nextStock = stocks.find(s => s.symbol !== selectedStockItem.symbol);
                          if (nextStock) {
                            handleSelectStock(nextStock.symbol);
                          }
                        }
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Selected Stock Detail */}
          <div className="lg:w-2/3 flex flex-col gap-4">
            {/* Stock Info */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center">
                    <span className={`inline-block w-8 h-8 rounded-full ${selectedStock.color} mr-2 text-white text-xs flex items-center justify-center`}>
                      {selectedStock.symbol.charAt(0)}
                    </span>
                    <div>
                      <h2 className="text-xl font-bold">{selectedStock.symbol}</h2>
                      <p className="text-sm text-gray-600">{selectedStock.name} • {selectedStock.exchange}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">${selectedStock.price.toFixed(2)}</div>
                  <div className="flex items-center justify-end">
                    <span className={`${selectedStock.change >= 0 ? "text-green-600" : "text-red-600"} font-medium`}>
                      {selectedStock.change >= 0 ? "+" : ""}${Math.abs(selectedStock.change).toFixed(2)}
                    </span>
                    <span className={`${selectedStock.changePercent >= 0 ? "text-green-600" : "text-red-600"} font-medium ml-2`}>
                      ({selectedStock.changePercent >= 0 ? "+" : ""}{selectedStock.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Open</div>
                  <div>${selectedStock.open?.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-500">High</div>
                  <div>${selectedStock.high?.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Low</div>
                  <div>${selectedStock.low?.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Volume</div>
                  <div>{selectedStock.volume}</div>
                </div>
              </div>
            </div>
            
            {/* Stock Chart */}
            <div className="bg-white p-4 rounded-lg shadow-md flex-grow">
              <div className="flex gap-2 mb-4">
                {["1D", "1W", "1M", "3M", "6M", "1Y", "5Y"].map(range => (
                  <button 
                    key={range}
                    onClick={() => handleTimeRangeSelect(range)}
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      selectedTimeRange === range 
                        ? "bg-blue-100 text-blue-800" 
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <AccessibleStockChart 
                data={chartData.length > 0 ? chartData : []} 
                title={selectedStock.symbol}
                isLoading={isChartLoading} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App with ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <Router>
        <DashboardContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
