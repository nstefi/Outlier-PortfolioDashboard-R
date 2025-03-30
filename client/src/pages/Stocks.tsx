import { useState, useEffect } from 'react';
import { Layout } from '../components/dashboard/Layout';
import { StockTable } from '../components/dashboard/StockTable';
import { getMultipleStockQuotes, searchStocks, defaultStocks, addToWatchlist, addToPortfolio } from '../services/stockService';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

export default function Stocks() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  
  useEffect(() => {
    fetchStocksData();
  }, []);
  
  async function fetchStocksData() {
    try {
      setIsLoading(true);
      
      // Get default stock quotes
      const stockData = await getMultipleStockQuotes(defaultStocks.map(s => s.symbol));
      setStocks(stockData);
    } catch (error) {
      console.error('Error fetching stocks data:', error);
      toast.error('Failed to load stocks data');
      
      // Use sample data for development
      const sampleData = defaultStocks.map(s => ({
        ...s,
        price: s.price || 100 + Math.random() * 200,
        change: s.change || (Math.random() * 10) - 5,
        changePercent: s.changePercent || (Math.random() * 5) - 2.5,
        marketCap: Math.random() * 1000000000000,
        volume: Math.random() * 10000000
      }));
      setStocks(sampleData);
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }
    
    try {
      setIsSearching(true);
      
      const results = await searchStocks(searchQuery);
      setSearchResults(results);
      
      if (results.length === 0) {
        toast.info('No stocks found matching your search');
      }
    } catch (error) {
      console.error('Error searching stocks:', error);
      toast.error('Failed to search stocks');
      
      // Clear results on error
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }
  
  const handleAddToWatchlist = (symbol: string) => {
    try {
      addToWatchlist(symbol);
      toast.success(`Added ${symbol} to watchlist`);
    } catch (error) {
      toast.error(`Failed to add ${symbol} to watchlist`);
    }
  };
  
  const handleAddToPortfolio = (symbol: string) => {
    try {
      const stock = [...stocks, ...searchResults].find(s => s.symbol === symbol);
      
      addToPortfolio({
        symbol,
        shares: 1,
        purchasePrice: stock?.price || 0,
        purchaseDate: new Date()
      });
      
      toast.success(`Added ${symbol} to portfolio`);
    } catch (error) {
      toast.error(`Failed to add ${symbol} to portfolio`);
    }
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };
  
  // Display search results if they exist, otherwise show default stocks
  const displayStocks = searchResults.length > 0 ? searchResults : stocks;
  
  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Stocks</h1>
        
        <form onSubmit={handleSearch} className="flex w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center"
          >
            {isSearching ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            ) : (
              <Search size={18} className="mr-1" />
            )}
            Search
          </button>
        </form>
      </div>
      
      {/* Search results or default stocks */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="font-semibold">
              {searchResults.length > 0 ? 'Search Results' : 'Popular Stocks'}
            </h2>
            <p className="text-sm text-gray-500">
              {searchResults.length > 0
                ? `Found ${searchResults.length} stocks matching "${searchQuery}"`
                : 'Showing popular and trending stocks'}
            </p>
          </div>
          
          {searchResults.length > 0 && (
            <button
              onClick={clearSearch}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear results
            </button>
          )}
        </div>
        
        <StockTable
          stocks={displayStocks}
          isLoading={isLoading || isSearching}
          showActions={true}
          onAddToWatchlist={handleAddToWatchlist}
          onAddToPortfolio={handleAddToPortfolio}
        />
      </div>
    </Layout>
  );
}