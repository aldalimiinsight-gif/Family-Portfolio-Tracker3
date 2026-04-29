import { Menu, Sun, Moon, RefreshCw, Bell } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { useStockPrices } from '../../hooks/useStockPrices';
import { calcStockMetrics } from '../../utils/calculations';
import { useState } from 'react';

export default function Header({ onMenuClick, title }) {
  const { dark, toggle } = useTheme();
  const { state } = usePortfolio();
  const { refreshAll } = useStockPrices();
  const [refreshing, setRefreshing] = useState(false);

  // Count stocks above alert threshold
  const alertCount = state.stocks.filter((s) => {
    const live = state.prices?.[s.ticker];
    if (!live?.price) return false;
    const { unrealizedPnLPct } = calcStockMetrics(s, live, state.settings.exchangeRates);
    return unrealizedPnLPct >= (s.alertThreshold || state.settings.alertThreshold);
  }).length;

  const handleRefresh = async () => {
    setRefreshing(true);
    refreshAll();
    setTimeout(() => setRefreshing(false), 2000);
  };

  return (
    <header className="sticky top-0 z-20 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: menu + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-white font-semibold text-base">{title}</h1>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Refresh prices */}
          <button
            onClick={handleRefresh}
            title="Refresh stock prices"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Alert badge */}
          {alertCount > 0 && (
            <div className="relative">
              <button className="p-2 rounded-lg text-amber-400 hover:bg-slate-800 transition-colors pulse-alert">
                <Bell className="w-4 h-4" />
              </button>
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {alertCount}
              </span>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
