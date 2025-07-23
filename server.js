// Import required modules
const express = require('express');
const axios = require('axios'); // Add axios for making HTTP requests

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies (useful for POST requests, though not used here)
app.use(express.json());

// --- Updated Endpoint using CoinGecko API ---
app.get('/data/price', async (req, res) => {
  try {
    // 1. Extract the 'symbol' from query parameters (e.g., ?symbol=BTC)
    let { symbol } = req.query;

    // 2. Validate input: Check if symbol is provided
    if (!symbol) {
      return res.status(400).json({ error: 'Missing required query parameter: symbol (e.g., BTC, ETH)' });
    }

    // 3. Normalize the symbol to uppercase (CoinGecko expects lowercase IDs)
    symbol = symbol.toLowerCase();

    // 4. --- Mapping Symbols to CoinGecko IDs ---
    // CoinGecko uses internal IDs (e.g., 'bitcoin' for BTC). We need to map common symbols.
    // Add more mappings here as needed.
    const symbolToIdMap = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'SOL': 'solana',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'DOGE': 'dogecoin',
      'DOT': 'polkadot',
      'AVAX': 'avalanche-2',
      'LINK': 'chainlink'
      // Add more symbols and their corresponding CoinGecko IDs here
    };

    // 5. Get the CoinGecko ID for the provided symbol
    const coinId = symbolToIdMap[symbol.toUpperCase()]; // Convert back to upper for map lookup

    // 6. Validate input: Check if we support the provided symbol
    if (!coinId) {
      return res.status(400).json({
        error: `Unsupported symbol: ${symbol.toUpperCase()}. Supported symbols: ${Object.keys(symbolToIdMap).join(', ')}`
      });
    }

    // 7. --- Call the CoinGecko API ---
    // Construct the API URL. We request the price in USD.
    // Using the public API endpoint which doesn't require an API key for simple price lookups.
    const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_last_updated_at=true`;

    // Make the GET request to CoinGecko
    const response = await axios.get(apiUrl);

    // 8. --- Process the Response ---
    // Check if CoinGecko returned data for the requested ID
    if (!response.data || !response.data[coinId] || response.data[coinId].usd === undefined) {
        console.error("Unexpected data structure from CoinGecko:", response.data);
        return res.status(500).json({ error: 'Failed to retrieve price data from CoinGecko' });
    }

    const priceData = response.data[coinId];
    const priceUsd = priceData.usd;
    const lastUpdatedTimestamp = priceData.last_updated_at ? new Date(priceData.last_updated_at * 1000).toISOString() : new Date().toISOString();

    // 9. --- Send the Response ---
    // Format the response according to your original structure (or adapt as needed)
    res.json({
      symbol: symbol.toUpperCase(), // Return the original symbol requested
      price: priceUsd,
      currency: "USD", // CoinGecko API call specifies USD
      timestamp: lastUpdatedTimestamp // Use CoinGecko's last updated time if available
    });

  } catch (error) {
    console.error("Error in /data/price endpoint:", error.message);
    // 10. --- Error Handling ---
    // Differentiate between API errors and server errors if possible
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("CoinGecko API Error Response:", error.response.status, error.response.data);
      res.status(error.response.status).json({ error: `External API error: ${error.response.statusText}` });
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received from CoinGecko API:", error.request);
      res.status(502).json({ error: 'Bad Gateway: No response from external API (CoinGecko)' });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error setting up request to CoinGecko API:", error.message);
      res.status(500).json({ error: 'Internal Server Error while fetching data from CoinGecko' });
    }
  }
});
// --- End of Updated Endpoint ---

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Enhanced Simple Financial Data API is running! Now fetching live crypto prices from CoinGecko.' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
