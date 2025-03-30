import { useState, useEffect } from 'react';
import { Layout } from '../components/dashboard/Layout';
import { StockCard } from '../components/dashboard/StockCard';
import { StockChart } from '../components/dashboard/StockChart';
import { PortfolioSummary } from '../components/dashboard/PortfolioSummary';
import { MarketOverview } from '../components/dashboard/MarketOverview';
import { StockTable } from '../components/dashboard/StockTable';
import { getMultipleStockQuotes, defaultStocks, defaultIndices, addToWatchlist, addToPortfolio, StockQuote } from '../services/stockService';
import { toast } from 'sonner';

// Define MarketIndexData interface to match the one in MarketOverview component
interface MarketIndexData {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function Dashboard() {
  const [topStocks, setTopStocks] = useState<StockQuote[]>([]);
  const [marketIndices, setMarketIndices] = useState<MarketIndexData[]>([]);
  const [portfolioData, setPortfolioData] = useState<any>({
    totalValue: 0,
    totalGain: 0,
    totalGainPercent: 0,
    holdings: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchTopStocks(),
      fetchMarketIndices(),
      fetchPortfolioData()
    ]).finally(() => {
      setIsLoading(false);
    });
  }, []);

  async function fetchTopStocks() {
    try {
      const stocks = await getMultipleStockQuotes(defaultStocks.map(s => s.symbol));
      setTopStocks(stocks);
    } catch (error) {
      console.error('Error fetching top stocks:', error);
      // Use some demo data for development
      setTopStocks(defaultStocks.map(s => ({
        ...s,
        price: s.price || 100 + Math.random() * 100,
        change: s.change || (Math.random() * 10) - 5,
        changePercent: s.changePercent || (Math.random() * 5) - 2.5,
      })));
    }
  }

  async function fetchMarketIndices() {
    try {
      const indices = await getMultipleStockQuotes(defaultIndices.map(i => i.symbol));
      setMarketIndices(indices.map((index, i) => ({
        ...index,
        name: defaultIndices[i].name
      })) as MarketIndexData[]);
    } catch (error) {
      console.error('Error fetching market indices:', error);
      // Use demo data
      setMarketIndices(defaultIndices.map(i => ({
        ...i,
        price: i.price || 1000 + Math.random() * 5000,
        change: i.change || (Math.random() * 50) - 25,
        changePercent: i.changePercent || (Math.random() * 3) - 1.5,
      })) as MarketIndexData[]);
    }
  }

  async function fetchPortfolioData() {
    // This would normally come from an API or local storage
    // For demo, we'll use mock data
    const mockPortfolio = {
      totalValue: 25420.50,
      totalGain: 1230.25,
      totalGainPercent: 4.8,
      holdings: [
        { symbol: 'AAPL', name: 'Apple Inc.', value: 8540.20, percentage: 33.6, color: '#16A34A' },
        { symbol: 'MSFT', name: 'Microsoft', value: 6230.75, percentage: 24.5, color: '#2563EB' },
        { symbol: 'GOOGL', name: 'Alphabet', value: 4120.30, percentage: 16.2, color: '#F59E0B' },
        { symbol: 'AMZN', name: 'Amazon', value: 3650.40, percentage: 14.4, color: '#EF4444' },
        { symbol: 'TSLA', name: 'Tesla', value: 2878.85, percentage: 11.3, color: '#8B5CF6' },
      ]
    };
    
    setPortfolioData(mockPortfolio);
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
      addToPortfolio({
        symbol,
        shares: 1,
        purchasePrice: topStocks.find(s => s.symbol === symbol)?.price || 0,
        purchaseDate: new Date()
      });
      toast.success(`Added ${symbol} to portfolio`);
    } catch (error) {
      toast.error(`Failed to add ${symbol} to portfolio`);
    }
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Summary */}
        <div className="lg:col-span-2">
          <PortfolioSummary
            totalValue={portfolioData.totalValue}
            totalGain={portfolioData.totalGain}
            totalGainPercent={portfolioData.totalGainPercent}
            holdings={portfolioData.holdings}
          />
        </div>
        
        {/* Market Overview */}
        <div>
          <MarketOverview 
            marketIndices={marketIndices} 
            isLoading={isLoading}
          />
        </div>
      </div>
      
      {/* Stock Chart */}
      <div className="mt-6">
        <StockChart
          data={[
            { date: '2023-01-01', value: 100 },
            { date: '2023-01-02', value: 120 },
            { date: '2023-01-03', value: 115 },
            { date: '2023-01-04', value: 130 },
            { date: '2023-01-05', value: 145 },
          ]}
          title="Portfolio Performance"
          isLoading={isLoading}
        />
      </div>
      
      {/* Top Stocks */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Top Stocks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topStocks.slice(0, 3).map((stock) => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              onAddToWatchlist={() => handleAddToWatchlist(stock.symbol)}
              onAddToPortfolio={() => handleAddToPortfolio(stock.symbol)}
            />
          ))}
        </div>
      </div>
      
      {/* Stock Table */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Market Movers</h2>
        <StockTable
          stocks={topStocks}
          showActions={true}
          onAddToWatchlist={handleAddToWatchlist}
          onAddToPortfolio={handleAddToPortfolio}
          isLoading={isLoading}
        />
      </div>
    </Layout>
  );
}