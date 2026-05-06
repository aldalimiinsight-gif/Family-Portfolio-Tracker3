import { useEffect, useCallback, useRef } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { fetchStockPrice } from '../utils/stockApi';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useStockPrices() {
  const { state, setPrice, setPriceLoading } = usePortfolio();
  const { stocks, prices, pricesLoading } = state;
  const fetchedRef = useRef(new Set());

  // force=true skips the TTL cache check — avoids stale-closure race in refresh functions
  const fetchPrice = useCallback(async (ticker, force = false) => {
    if (!force) {
      const cached = prices[ticker];
      if (cached && cached.lastUpdated && Date.now() - cached.lastUpdated < CACHE_TTL) return;
    }
    if (pricesLoading[ticker]) return;

    setPriceLoading(ticker, true);
    try {
      const data = await fetchStockPrice(ticker);
      setPrice(ticker, data);
    } catch (err) {
      // Persist a sentinel so we don't retry on every render cycle
      setPrice(ticker, { ticker, price: null, error: err.message, lastUpdated: Date.now() });
    } finally {
      setPriceLoading(ticker, false);
    }
  }, [prices, pricesLoading, setPrice, setPriceLoading]);

  // Fetch prices for any ticker not yet attempted this session
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

  // Force-refresh all prices regardless of cache age
  const refreshAll = useCallback(() => {
    fetchedRef.current.clear();
    stocks.forEach((s) => fetchPrice(s.ticker, true));
  }, [stocks, fetchPrice]);

  // Force-refresh a single ticker — passes force=true to bypass the stale closure issue
  const refreshTicker = useCallback((ticker) => {
    fetchedRef.current.delete(ticker);
    fetchPrice(ticker, true);
  }, [fetchPrice]);

  return { refreshAll, refreshTicker };
}
