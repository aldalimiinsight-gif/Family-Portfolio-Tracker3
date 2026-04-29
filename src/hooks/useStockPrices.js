import { useEffect, useCallback, useRef } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { fetchStockPrice } from '../utils/stockApi';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useStockPrices() {
  const { state, setPrice, setPriceLoading } = usePortfolio();
  const { stocks, prices, pricesLoading } = state;
  const fetchedRef = useRef(new Set());

  const fetchPrice = useCallback(async (ticker) => {
    const cached = prices[ticker];
    if (cached && Date.now() - cached.lastUpdated < CACHE_TTL) return;
    if (pricesLoading[ticker]) return;

    setPriceLoading(ticker, true);
    try {
      const data = await fetchStockPrice(ticker);
      setPrice(ticker, data);
    } catch (err) {
      // Store a fallback so we don't retry constantly
      setPrice(ticker, { ticker, price: null, error: err.message });
    } finally {
      setPriceLoading(ticker, false);
    }
  }, [prices, pricesLoading, setPrice, setPriceLoading]);

  useEffect(() => {
    if (!stocks.length) return;
    stocks.forEach((stock) => {
      const key = stock.ticker;
      if (!fetchedRef.current.has(key)) {
        fetchedRef.current.add(key);
        fetchPrice(key);
      }
    });
  }, [stocks, fetchPrice]);

  const refreshAll = useCallback(() => {
    fetchedRef.current.clear();
    stocks.forEach((s) => fetchPrice(s.ticker));
  }, [stocks, fetchPrice]);

  const refreshTicker = useCallback((ticker) => {
    // Force re-fetch by clearing cache entry
    setPrice(ticker, { ticker, price: null, lastUpdated: 0 });
    fetchPrice(ticker);
  }, [setPrice, fetchPrice]);

  return { refreshAll, refreshTicker };
}
