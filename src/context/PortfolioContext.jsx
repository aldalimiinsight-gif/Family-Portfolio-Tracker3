import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { sampleData } from '../utils/sampleData';

const PortfolioContext = createContext(null);
const STORAGE_KEY = 'fpt_portfolio_v2';

const initialState = {
  stocks: [],
  realEstate: [],
  business: [],
  members: [],
  contributions: [],
  monthlyUploads: [],
  settings: {
    alertThreshold: 30,
    baseCurrency: 'USD',
    exchangeRates: { QAR: 0.2747, SAR: 0.2667, GBP: 1.27, EUR: 1.08 },
  },
  prices: {},          // { ticker: { price, previousClose, currency, lastUpdated } }
  pricesLoading: {},   // { ticker: boolean }
};

function reducer(state, action) {
  switch (action.type) {
    // ---- STOCKS ----
    case 'ADD_STOCK':
      return { ...state, stocks: [...state.stocks, action.payload] };
    case 'UPDATE_STOCK':
      return {
        ...state,
        stocks: state.stocks.map((s) => (s.id === action.payload.id ? action.payload : s)),
      };
    case 'DELETE_STOCK':
      return { ...state, stocks: state.stocks.filter((s) => s.id !== action.payload) };

    // ---- REAL ESTATE ----
    case 'ADD_REAL_ESTATE':
      return { ...state, realEstate: [...state.realEstate, action.payload] };
    case 'UPDATE_REAL_ESTATE':
      return {
        ...state,
        realEstate: state.realEstate.map((r) => (r.id === action.payload.id ? action.payload : r)),
      };
    case 'DELETE_REAL_ESTATE':
      return { ...state, realEstate: state.realEstate.filter((r) => r.id !== action.payload) };

    // ---- BUSINESS ----
    case 'ADD_BUSINESS':
      return { ...state, business: [...state.business, action.payload] };
    case 'UPDATE_BUSINESS':
      return {
        ...state,
        business: state.business.map((b) => (b.id === action.payload.id ? action.payload : b)),
      };
    case 'DELETE_BUSINESS':
      return { ...state, business: state.business.filter((b) => b.id !== action.payload) };

    // ---- MEMBERS ----
    case 'ADD_MEMBER':
      return { ...state, members: [...state.members, action.payload] };
    case 'UPDATE_MEMBER':
      return {
        ...state,
        members: state.members.map((m) => (m.id === action.payload.id ? action.payload : m)),
      };
    case 'DELETE_MEMBER':
      return {
        ...state,
        members: state.members.filter((m) => m.id !== action.payload),
        contributions: state.contributions.filter((c) => c.memberId !== action.payload),
      };

    // ---- CONTRIBUTIONS ----
    case 'ADD_CONTRIBUTION':
      return { ...state, contributions: [...state.contributions, action.payload] };
    case 'UPDATE_CONTRIBUTION':
      return {
        ...state,
        contributions: state.contributions.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CONTRIBUTION':
      return { ...state, contributions: state.contributions.filter((c) => c.id !== action.payload) };

    // ---- MONTHLY UPLOAD ----
    case 'APPEND_MONTHLY_DATA': {
      const { uploadDate, entries, overwrite } = action.payload;
      const existing = state.monthlyUploads.find((u) => u.date === uploadDate);
      if (existing && !overwrite) return state; // skip
      const filtered = state.monthlyUploads.filter((u) => u.date !== uploadDate);
      return {
        ...state,
        monthlyUploads: [...filtered, { date: uploadDate, uploadedAt: new Date().toISOString(), entries }],
        contributions: [
          ...state.contributions.filter((c) => overwrite ? c.uploadDate !== uploadDate : true),
          ...entries.filter((e) => e.type === 'contribution'),
        ],
        stocks: mergeStocks(state.stocks, entries.filter((e) => e.type === 'stock'), overwrite, uploadDate),
        realEstate: mergeRealEstate(state.realEstate, entries.filter((e) => e.type === 'realestate'), overwrite, uploadDate),
        business: mergeBusiness(state.business, entries.filter((e) => e.type === 'business'), overwrite, uploadDate),
      };
    }

    // ---- PRICES ----
    case 'SET_PRICE':
      return {
        ...state,
        prices: {
          ...state.prices,
          [action.payload.ticker]: { ...action.payload, lastUpdated: Date.now() },
        },
      };
    case 'SET_PRICE_LOADING':
      return {
        ...state,
        pricesLoading: { ...state.pricesLoading, [action.payload.ticker]: action.payload.loading },
      };

    // ---- SETTINGS ----
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    // ---- LOAD SAMPLE DATA ----
    case 'LOAD_SAMPLE_DATA':
      return { ...initialState, ...sampleData };

    // ---- RESET ----
    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

function mergeStocks(existing, newEntries, overwrite, uploadDate) {
  if (!newEntries.length) return existing;
  if (overwrite) {
    return [
      ...existing.filter((s) => s.uploadDate !== uploadDate),
      ...newEntries.map((e) => ({ ...e, uploadDate })),
    ];
  }
  return [...existing, ...newEntries.map((e) => ({ ...e, uploadDate }))];
}

function mergeRealEstate(existing, newEntries, overwrite, uploadDate) {
  if (!newEntries.length) return existing;
  if (overwrite) {
    return [
      ...existing.filter((r) => r.uploadDate !== uploadDate),
      ...newEntries.map((e) => ({ ...e, uploadDate })),
    ];
  }
  return [...existing, ...newEntries.map((e) => ({ ...e, uploadDate }))];
}

function mergeBusiness(existing, newEntries, overwrite, uploadDate) {
  if (!newEntries.length) return existing;
  if (overwrite) {
    return [
      ...existing.filter((b) => b.uploadDate !== uploadDate),
      ...newEntries.map((e) => ({ ...e, uploadDate })),
    ];
  }
  return [...existing, ...newEntries.map((e) => ({ ...e, uploadDate }))];
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    // Exclude live prices — always re-fetched on startup
    // eslint-disable-next-line no-unused-vars
    const { prices, pricesLoading, ...persist } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
  } catch (e) {
    console.warn('Portfolio save failed:', e);
  }
}

export function PortfolioProvider({ children }) {
  const saved = loadState();
  const [state, dispatch] = useReducer(reducer, saved ? { ...initialState, ...saved } : initialState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const setPrice = useCallback((ticker, data) => {
    dispatch({ type: 'SET_PRICE', payload: { ticker, ...data } });
  }, []);

  const setPriceLoading = useCallback((ticker, loading) => {
    dispatch({ type: 'SET_PRICE_LOADING', payload: { ticker, loading } });
  }, []);

  return (
    <PortfolioContext.Provider value={{ state, dispatch, setPrice, setPriceLoading }}>
      {children}
    </PortfolioContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePortfolio() {
  return useContext(PortfolioContext);
}
