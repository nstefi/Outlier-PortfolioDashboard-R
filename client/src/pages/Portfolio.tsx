import { useState, useEffect } from 'react';
import { Layout } from '../components/dashboard/Layout';
import { StockTable } from '../components/dashboard/StockTable';
import { StockChart } from '../components/dashboard/StockChart';
import { PortfolioSummary } from '../components/dashboard/PortfolioSummary';
import { getMultipleStockQuotes, getPortfolio, removeFromPortfolio, formatCurrency } from '../services/stockService';
import { toast } from 'sonner';

export default function Portfolio() {
  const [portfolioHoldings, setPortfolioHoldings] = useState<any[]>([]);
  const [portfolioStocks, setPortfolioStocks] = useState<any[]>([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [portfolioGain, setPortfolioGain] = useState(0);
  const [portfolioGainPercent, setPortfolioGainPercent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchPortfolioData();
  }, []);
  
  async function fetchPortfolioData() {
    try {
      setIsLoading(true);
      
      // Get portfolio from storage
      const portfolioData = getPortfolio();
      
      if (portfolioData.length === 0) {
        setIsLoading(false);
        return;
      }
      
      // Get current quotes for all portfolio stocks
      const symbols = portfolioData.map(item => item.symbol);
      const quotes = await getMultipleStockQuotes(symbols);
      
      // Calculate current values and gains/losses
      const holdingsWithCurrentData = portfolioData.map(holding => {
        const quote = quotes.find(q => q.symbol === holding.symbol);
        const currentPrice = quote?.price || 0;
        const currentValue = currentPrice * holding.shares;
        const initialValue = holding.purchasePrice * holding.shares;
        const gainLoss = currentValue - initialValue;
        const gainLossPercent = initialValue > 0 ? (gainLoss / initialValue) * 100 : 0;
        
        return {
          ...holding,
          currentPrice,
          currentValue,
          initialValue,
          gainLoss,
          gainLossPercent
        };
      });
      
      // Calculate portfolio totals
      const totalValue = holdingsWithCurrentData.reduce((sum, item) => sum + item.currentValue, 0);
      const totalInitial = holdingsWithCurrentData.reduce((sum, item) => sum + item.initialValue, 0);
      const totalGain = totalValue - totalInitial;
      const totalGainPercent = totalInitial > 0 ? (totalGain / totalInitial) * 100 : 0;
      
      // Prepare data for portfolio chart
      const holdingsForPieChart = holdingsWithCurrentData.map((holding, index) => {
        // Generate a basic color palette
        const colors = ['#16A34A', '#2563EB', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
        const colorIndex = index % colors.length;
        
        return {
          symbol: holding.symbol,
          name: quotes.find(q => q.symbol === holding.symbol)?.shortName || holding.symbol,
          value: holding.currentValue,
          percentage: (holding.currentValue / totalValue) * 100,
          color: colors[colorIndex]
        };
      });
      
      // Update state with calculated data
      setPortfolioHoldings(holdingsWithCurrentData);
      setPortfolioStocks(quotes);
      setPortfolioValue(totalValue);
      setPortfolioGain(totalGain);
      setPortfolioGainPercent(totalGainPercent);
      
      // Mock for development - ensure we have some data
      if (holdingsWithCurrentData.length === 0) {
        const mockHoldings = [
          { symbol: 'AAPL', name: 'Apple Inc.', value: 8540.20, percentage: 33.6, color: '#16A34A' },
          { symbol: 'MSFT', name: 'Microsoft', value: 6230.75, percentage: 24.5, color: '#2563EB' },
          { symbol: 'GOOGL', name: 'Alphabet', value: 4120.30, percentage: 16.2, color: '#F59E0B' },
          { symbol: 'AMZN', name: 'Amazon', value: 3650.40, percentage: 14.4, color: '#EF4444' },
          { symbol: 'TSLA', name: 'Tesla', value: 2878.85, percentage: 11.3, color: '#8B5CF6' },
        ];
        setPortfolioValue(25420.50);
        setPortfolioGain(1230.25);
        setPortfolioGainPercent(4.8);
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      toast.error('Failed to load portfolio data');
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleRemoveFromPortfolio = (symbol: string) => {
    try {
      removeFromPortfolio(symbol);
      fetchPortfolioData();
      toast.success(`Removed ${symbol} from portfolio`);
    } catch (error) {
      toast.error(`Failed to remove ${symbol} from portfolio`);
    }
  };
  
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">My Portfolio</h1>
      
      {portfolioHoldings.length === 0 && !isLoading ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-medium text-gray-700 mb-2">Your portfolio is empty</h3>
          <p className="text-gray-500 mb-4">
            Start adding stocks to your portfolio to track their performance.
          </p>
          <a 
            href="/stocks" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block"
          >
            Browse Stocks
          </a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Portfolio Summary */}
            <div className="lg:col-span-2">
              <PortfolioSummary
                totalValue={portfolioValue}
                totalGain={portfolioGain}
                totalGainPercent={portfolioGainPercent}
                holdings={portfolioHoldings.map((holding, index) => {
                  // Generate a basic color palette
                  const colors = ['#16A34A', '#2563EB', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
                  const colorIndex = index % colors.length;
                  
                  return {
                    symbol: holding.symbol,
                    name: portfolioStocks.find(s => s.symbol === holding.symbol)?.shortName,
                    value: holding.currentValue,
                    percentage: (holding.currentValue / portfolioValue) * 100,
                    color: colors[colorIndex]
                  };
                })}
              />
            </div>
            
            {/* Portfolio Stats */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-4">Portfolio Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Value:</span>
                  <span className="font-medium">{formatCurrency(portfolioValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Gain/Loss:</span>
                  <span className={`font-medium ${portfolioGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(portfolioGain)} ({portfolioGainPercent.toFixed(2)}%)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Number of Holdings:</span>
                  <span className="font-medium">{portfolioHoldings.length}</span>
                </div>
                <button
                  onClick={fetchPortfolioData}
                  className="w-full mt-2 px-3 py-1.5 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
          
          {/* Portfolio Holdings Table */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Holdings</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Symbol</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-right">Shares</th>
                    <th className="px-4 py-2 text-right">Avg Cost</th>
                    <th className="px-4 py-2 text-right">Current Price</th>
                    <th className="px-4 py-2 text-right">Market Value</th>
                    <th className="px-4 py-2 text-right">Gain/Loss</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {portfolioHoldings.map((holding) => {
                    const stock = portfolioStocks.find(s => s.symbol === holding.symbol);
                    return (
                      <tr key={holding.symbol} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{holding.symbol}</td>
                        <td className="px-4 py-2">{stock?.shortName || stock?.longName || '-'}</td>
                        <td className="px-4 py-2 text-right">{holding.shares}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(holding.purchasePrice)}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(holding.currentPrice)}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(holding.currentValue)}</td>
                        <td className={`px-4 py-2 text-right ${holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(holding.gainLoss)} ({holding.gainLossPercent.toFixed(2)}%)
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => handleRemoveFromPortfolio(holding.symbol)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Performance Chart */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-semibold mb-4">Portfolio Performance</h3>
            <div className="h-64">
              <StockChart
                data={[
                  { date: '2023-01-01', value: 100 },
                  { date: '2023-01-02', value: 120 },
                  { date: '2023-01-03', value: 115 },
                  { date: '2023-01-04', value: 130 },
                  { date: '2023-01-05', value: 145 },
                ]}
                isLoading={isLoading}
              />
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}