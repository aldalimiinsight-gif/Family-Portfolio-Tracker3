const https = require('https');

function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        ...headers,
      },
    };
    https.get(url, opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error')); }
      });
    }).on('error', reject);
  });
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  const { ticker } = event.queryStringParameters || {};
  if (!ticker) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'ticker required' }) };
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d&includePrePost=false`;
    const data = await fetchJson(url);
    const result = data?.chart?.result?.[0];
    if (!result) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Ticker not found', ticker }) };
    }

    const meta = result.meta;
    const closes = result.indicators?.quote?.[0]?.close || [];
    const timestamps = result.timestamp || [];

    // Build 5-day history
    const history = timestamps
      .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().split('T')[0], close: closes[i] }))
      .filter((d) => d.close != null);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ticker,
        name: meta.longName || meta.shortName || ticker,
        price: meta.regularMarketPrice,
        previousClose: meta.chartPreviousClose || meta.previousClose,
        currency: meta.currency,
        exchange: meta.exchangeName,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
        marketCap: meta.marketCap,
        history,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Failed to fetch stock data', ticker }),
    };
  }
};
