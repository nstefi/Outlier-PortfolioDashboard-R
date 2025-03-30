# Portfolio Dashboard

A comprehensive financial portfolio dashboard that provides real-time stock performance insights and interactive data visualization with enhanced user engagement features.

## Features

- Portfolio tracking with shares and purchase price
- Real-time stock quotes and charts
- Color-blind friendly design
- Customizable watchlist
- Historical data visualization
- Asset allocation insights

## Stack

- React frontend
- Yahoo Finance API
- Recharts for data visualization
- TypeScript for type-safe development
- Tailwind CSS for styling

## Deploying to Netlify

This application is ready to be deployed to Netlify. Follow these steps:

1. Push your code to a GitHub repository
2. Log in to Netlify and click "New site from Git"
3. Select your GitHub repository
4. Configure the deployment settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Advanced build settings: 
     - Add environment variable `NODE_VERSION` with value `20` to ensure Node.js 20 is used

5. Click "Deploy site"

Netlify will automatically detect the `netlify.toml` configuration file and set up the serverless functions.

## Development

To run the application locally:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5000`.

## Project Structure

- `client/`: React frontend application
- `netlify/functions/`: Serverless functions for API endpoints
- `server/`: Express server for local development
- `shared/`: Shared types and utilities

## API Endpoints

- `/api/health` - Health check endpoint
- `/api/stocks/quote/:symbol` - Get a stock quote
- `/api/stocks/chart/:symbol` - Get historical chart data
- `/api/stocks/search` - Search for stocks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License
None
