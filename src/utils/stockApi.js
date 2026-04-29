/**
 * Stock price fetching.
 * In production (Netlify) → calls /.netlify/functions/stock-price
 * In dev → calls same function via Vite proxy or direct Yahoo Finance
 */

const BASE = import.meta.env.PROD
  ? '/.netlify/functions'
  : '/.netlify/functions'; // vite dev server proxies via netlify dev

export async function fetchStockPrice(ticker) {
  const res = await fetch(`${BASE}/stock-price?ticker=${encodeURIComponent(ticker)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchStockAnalysis(ticker) {
  const res = await fetch(`${BASE}/stock-analysis?ticker=${encodeURIComponent(ticker)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Exchange suffix helper
export function toYahooTicker(ticker, exchange) {
  if (exchange === 'QSE' && !ticker.includes('.')) return `${ticker}.QA`;
  if (exchange === 'Tadawul' && !ticker.includes('.')) return `${ticker}.SR`;
  return ticker;
}

// Determine exchange from ticker format
export function detectExchange(ticker) {
  if (ticker.endsWith('.QA')) return 'QSE';
  if (ticker.endsWith('.SR')) return 'Tadawul';
  return 'US';
}
