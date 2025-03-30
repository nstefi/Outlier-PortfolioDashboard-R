import { useState, useEffect } from 'react';
import { Layout } from '../components/dashboard/Layout';
import { StockTable } from '../components/dashboard/StockTable';
import { getMultipleStockQuotes, getWatchlist, removeFromWatchlist, addToPortfolio } from '../services/stockService';
import { toast } from 'sonner';
import { Eye, EyeOff, PlusCircle } from 'lucide-react';

export default function Watchlist() {
  const [watchlistItems, setWatchlistItems] = useState<any[]>([]);
  const [watchlistStocks, setWatchlistStocks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchWatchlistData();
  }, []);
  
  async function fetchWatchlistData() {
    try {
      setIsLoading(true);
      
      // Get watchlist from storage
      const watchlist = getWatchlist();
      setWatchlistItems(watchlist);
      
      if (watchlist.length === 0) {
        setIsLoading(false);
        return;
      }
      
      // Get current quotes for all watchlist stocks
      const symbols = watchlist.map(item => item.symbol);
      const quotes = await getMultipleStockQuotes(symbols);
      
      setWatchlistStocks(quotes);
    } catch (error) {
      console.error('Error fetching watchlist data:', error);
      toast.error('Failed to load watchlist data');
      
      // Generate some sample data for development
      if (watchlistItems.length > 0) {
        const sampleData = watchlistItems.map(item => ({
          symbol: item.symbol,
          shortName: `${item.symbol} Inc.`,
          price: 100 + Math.random() * 200,
          change: (Math.random() * 10) - 5,
          changePercent: (Math.random() * 5) - 2.5,
          marketCap: Math.random() * 1000000000000,
          volume: Math.random() * 10000000
        }));
        setWatchlistStocks(sampleData);
      }
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleRemoveFromWatchlist = (symbol: string) => {
    try {
      removeFromWatchlist(symbol);
      setWatchlistItems(prevItems => prevItems.filter(item => item.symbol !== symbol));
      setWatchlistStocks(prevStocks => prevStocks.filter(stock => stock.symbol !== symbol));
      toast.success(`Removed ${symbol} from watchlist`);
    } catch (error) {
      toast.error(`Failed to remove ${symbol} from watchlist`);
    }
  };
  
  const handleAddToPortfolio = (symbol: string) => {
    try {
      const stock = watchlistStocks.find(s => s.symbol === symbol);
      
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
  
  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Watchlist</h1>
        <button 
          onClick={fetchWatchlistData}
          className="px-3 py-1.5 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-sm flex items-center"
        >
          <Eye size={16} className="mr-1" />
          Refresh
        </button>
      </div>
      
      {watchlistItems.length === 0 && !isLoading ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium text-gray-700 mb-2">Your watchlist is empty</h3>
          <p className="text-gray-500 mb-4">
            Add stocks to your watchlist to track their performance without adding them to your portfolio.
          </p>
          <a 
            href="/stocks" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block"
          >
            Browse Stocks
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Watchlist Stocks</h2>
            <p className="text-sm text-gray-500">Tracking {watchlistItems.length} stocks</p>
          </div>
          
          <StockTable 
            stocks={watchlistStocks}
            isLoading={isLoading}
            showActions={true}
            onAddToWatchlist={undefined}
            onAddToPortfolio={handleAddToPortfolio}
            customActions={(symbol) => (
              <button
                onClick={() => handleRemoveFromWatchlist(symbol)}
                className="inline-flex items-center text-sm text-red-600 hover:text-red-800"
              >
                <EyeOff size={14} className="mr-1" />
                Remove
              </button>
            )}
          />
        </div>
      )}
    </Layout>
  );
}