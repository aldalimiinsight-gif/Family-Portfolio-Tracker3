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

  const alertCount = state.stocks.filter((s) => {
    const live = state.prices?.[s.ticker];
    if (!live?.price) return false;
    const { unrealizedPnLPct } = calcStockMetrics(s, live, state.settings.exchangeRates);
    return unrealizedPnLPct >= (s.alertThreshold || state.settings.alertThreshold);
  }).length;

  const handleRefresh = () => {
    setRefreshing(true);
    refreshAll();
    setTimeout(() => setRefreshing(false), 2000);
  };

  return (
    <header
      className="sticky top-0 z-20 px-4 py-3 shrink-0"
      style={{
        background: 'rgba(6, 11, 24, 0.88)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '0 1px 0 rgba(99,102,241,0.06)',
      }}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block w-px h-4 bg-white/10" />
            <h1 className="text-white font-semibold text-sm tracking-tight">{title}</h1>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            title="Refresh stock prices"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {alertCount > 0 && (
            <div className="relative">
              <button className="p-2 rounded-lg text-amber-400 hover:bg-white/5 transition-colors pulse-alert">
                <Bell className="w-4 h-4" />
              </button>
              <span
                className="absolute -top-0.5 -right-0.5 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                {alertCount}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="w-px h-4 bg-white/10 mx-1" />

          <button
            onClick={toggle}
            title="Toggle theme"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            {dark
              ? <Sun className="w-4 h-4 text-amber-400" />
              : <Moon className="w-4 h-4" />
            }
          </button>
        </div>
      </div>
    </header>
  );
}
