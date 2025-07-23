const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Mock Financial Data Endpoint
app.get('/data/price', (req, res) => {
  try {
    const { symbol } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: 'Missing "symbol" query parameter' });
    }

    // Mock financial data
    const mockData = {
      AAPL: { price: 182.50, currency: 'USD' },
      BTC: { price: 30000.00, currency: 'USD' },
      ETH: { price: 2000.00, currency: 'USD' },
    };

    const data = mockData[symbol.toUpperCase()];

    if (!data) {
      return res.status(404).json({ error: 'Symbol not found' });
    }

    res.json({
      symbol,
      price: data.price,
      currency: data.currency,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Simple Financial Data API is running!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});