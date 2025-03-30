import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/dashboard/Layout';
import { StockChart } from '../components/dashboard/StockChart';
import { getStockQuote, getHistoricalData, addToWatchlist, addToPortfolio, formatCurrency, formatLargeNumber } from '../services/stockService';
import { toast } from 'sonner';
import { ArrowUp, ArrowDown, Info, TrendingUp, TrendingDown, PlusCircle, Eye } from 'lucide-react';

export default function StockDetails() {
  const { symbol } = useParams<{ symbol: string }>();
  const [stock, setStock] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<string>('1M');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (symbol) {
      fetchStockData();
      fetchChartData(timeRange);
    }
  }, [symbol]);
  
  async function fetchStockData() {
    try {
      setIsLoading(true);
      const data = await getStockQuote(symbol || '');
      setStock(data);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error(`Failed to load data for ${symbol}`);
      
      // Set some fallback data for development
      setStock({
        symbol: symbol,
        longName: 'Stock Company',
        shortName: symbol,
        price: 150.25,
        change: 2.5,
        changePercent: 1.75,
        marketCap: 2000000000,
        volume: 5000000,
        averageVolume: 4500000,
        open: 148.75,
        high: 151.30,
        low: 147.80,
        previousClose: 147.75
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  async function fetchChartData(period: string) {
    try {
      setIsLoading(true);
      setTimeRange(period);
      
      const data = await getHistoricalData(symbol || '', period);
      const formattedData = data.map((item: any) => ({
        date: new Date(item.date).toISOString().split('T')[0],
        value: item.close
      }));
      
      setChartData(formattedData);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      
      // Generate some mock chart data for development
      const mockData = [];
      const today = new Date();
      
      let days = 30;
      if (period === '1D') days = 1;
      if (period === '1W') days = 7;
      if (period === '3M') days = 90;
      if (period === '6M') days = 180;
      if (period === '1Y') days = 365;
      if (period === '5Y') days = 365 * 5;
      
      const startPrice = 100;
      const maxVariation = startPrice * 0.3; // 30% max variation
      
      let currentPrice = startPrice;
      for (let i = days; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Random walk with trend
        const trend = period === '5Y' ? 0.1 : 0.05; // Long term upward trend
        const randomChange = (Math.random() - 0.48) * maxVariation / days;
        currentPrice = Math.max(1, currentPrice * (1 + randomChange + trend / days));
        
        mockData.push({
          date: date.toISOString().split('T')[0],
          value: currentPrice
        });
      }
      
      setChartData(mockData);
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleAddToWatchlist = () => {
    try {
      addToWatchlist(symbol || '');
      toast.success(`Added ${symbol} to watchlist`);
    } catch (error) {
      toast.error(`Failed to add ${symbol} to watchlist`);
    }
  };
  
  const handleAddToPortfolio = () => {
    try {
      addToPortfolio({
        symbol: symbol || '',
        shares: 1,
        purchasePrice: stock?.price || 0,
        purchaseDate: new Date()
      });
      toast.success(`Added ${symbol} to portfolio`);
    } catch (error) {
      toast.error(`Failed to add ${symbol} to portfolio`);
    }
  };
  
  if (!stock && !isLoading) {
    return (
      <Layout>
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Stock Not Found</h2>
          <p className="mb-4">We couldn't find any data for {symbol}.</p>
          <a 
            href="/" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Dashboard
          </a>
        </div>
      </Layout>
    );
  }
  
  const isPositive = (stock?.change || 0) >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  
  return (
    <Layout>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">{stock?.symbol}</h1>
            <p className="text-gray-600">{stock?.longName || stock?.shortName}</p>
          </div>
          
          <div className="mt-2 md:mt-0 flex items-center">
            <div className="text-2xl font-bold mr-4">
              {stock?.price ? formatCurrency(stock.price) : '-'}
            </div>
            
            <div className={`flex items-center ${changeColor}`}>
              <TrendIcon size={20} className="mr-1" />
              <span className="font-medium">
                {stock?.change ? stock.change.toFixed(2) : '-'} ({stock?.changePercent ? stock.changePercent.toFixed(2) : '-'}%)
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            onClick={handleAddToPortfolio}
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusCircle size={16} className="mr-1" />
            Add to Portfolio
          </button>
          
          <button 
            onClick={handleAddToWatchlist}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Eye size={16} className="mr-1" />
            Add to Watchlist
          </button>
        </div>
      </div>
      
      {/* Stock Chart */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Price Chart</h2>
          
          <div className="flex space-x-1">
            {['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'].map((period) => (
              <button
                key={period}
                onClick={() => fetchChartData(period)}
                className={`px-2 py-1 text-xs rounded ${
                  timeRange === period 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-64">
          <StockChart 
            data={chartData}
            isLoading={isLoading}
          />
        </div>
      </div>
      
      {/* Stock Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Key Stats */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-4">Key Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Open</div>
              <div className="font-medium">{stock?.open ? formatCurrency(stock.open) : '-'}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">Previous Close</div>
              <div className="font-medium">{stock?.previousClose ? formatCurrency(stock.previousClose) : '-'}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">Day High</div>
              <div className="font-medium">{stock?.high ? formatCurrency(stock.high) : '-'}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">Day Low</div>
              <div className="font-medium">{stock?.low ? formatCurrency(stock.low) : '-'}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">Volume</div>
              <div className="font-medium">{stock?.volume ? formatLargeNumber(stock.volume) : '-'}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">Avg. Volume</div>
              <div className="font-medium">{stock?.averageVolume ? formatLargeNumber(stock.averageVolume) : '-'}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">Market Cap</div>
              <div className="font-medium">{stock?.marketCap ? formatLargeNumber(stock.marketCap) : '-'}</div>
            </div>
          </div>
        </div>
        
        {/* About */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-4">About {stock?.shortName || symbol}</h2>
          <p className="text-gray-700 mb-4">
            {stock?.description || `${stock?.shortName || symbol} is a publicly traded company. View the stock chart to analyze historical performance or add this stock to your portfolio.`}
          </p>
          
          <div className="flex items-center text-blue-600">
            <Info size={16} className="mr-1" />
            <a 
              href={`https://finance.yahoo.com/quote/${symbol}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm"
            >
              View on Yahoo Finance
            </a>
          </div>
        </div>
      </div>
      
      {/* Additional Analysis */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-4">Market Performance</h2>
        <div className="overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">vs. S&P 500</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { period: '1 Day', change: 1.5, vsMarket: 0.8 },
                { period: '1 Week', change: -2.3, vsMarket: -3.1 },
                { period: '1 Month', change: 5.7, vsMarket: 2.2 },
                { period: '3 Months', change: 12.4, vsMarket: 8.5 },
                { period: '1 Year', change: 24.8, vsMarket: 15.3 },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.period}</td>
                  <td className={`px-4 py-3 text-sm ${row.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <div className="flex items-center">
                      {row.change >= 0 ? (
                        <ArrowUp size={14} className="mr-1" />
                      ) : (
                        <ArrowDown size={14} className="mr-1" />
                      )}
                      {Math.abs(row.change).toFixed(2)}%
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${row.vsMarket >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <div className="flex items-center">
                      {row.vsMarket >= 0 ? (
                        <ArrowUp size={14} className="mr-1" />
                      ) : (
                        <ArrowDown size={14} className="mr-1" />
                      )}
                      {Math.abs(row.vsMarket).toFixed(2)}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}