import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Building2, Briefcase, Users, ArrowRight, Activity } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { useStockPrices } from '../hooks/useStockPrices';
import {
  calcTotalPortfolioValue, calcAllocation, calcMemberContributions,
  calcMemberNetWorth, buildGrowthHistory, calcStockMetrics,
  fmtCurrency, fmtPct, pnlColor,
} from '../utils/calculations';
import MetricCard from '../components/common/MetricCard';
import AllocationChart from '../components/charts/AllocationChart';
import GrowthChart from '../components/charts/GrowthChart';
import StockBarChart from '../components/charts/StockBarChart';

export default function Dashboard() {
  const { state } = usePortfolio();
  useStockPrices();

  const { stocks, realEstate, business, members, contributions, settings, prices } = state;

  const totals = useMemo(
    () => calcTotalPortfolioValue(state, prices),
    [state, prices]
  );

  const allocation = useMemo(
    () => calcAllocation(totals.stocksVal, totals.reVal, totals.bizVal),
    [totals]
  );

  const memberData = useMemo(
    () => calcMemberContributions(contributions, members, settings.exchangeRates).map((m) => ({
      ...m,
      netWorth: calcMemberNetWorth(m, totals.total),
    })),
    [contributions, members, settings.exchangeRates, totals.total]
  );

  const growthHistory = useMemo(() => buildGrowthHistory(contributions), [contributions]);

  const stockPerformance = useMemo(() =>
    stocks.map((s) => {
      const live = prices?.[s.ticker];
      const { unrealizedPnLPct } = calcStockMetrics(s, live, settings.exchangeRates);
      return { ticker: s.ticker.replace(/\.(QA|SR)$/, ''), name: s.name, pnlPct: unrealizedPnLPct };
    }).sort((a, b) => b.pnlPct - a.pnlPct),
    [stocks, prices, settings.exchangeRates]
  );

  const topPerformer = stockPerformance[0];
  const alertStocks = stocks.filter((s) => {
    const live = prices?.[s.ticker];
    if (!live?.price) return false;
    const { unrealizedPnLPct } = calcStockMetrics(s, live, settings.exchangeRates);
    return unrealizedPnLPct >= (s.alertThreshold || settings.alertThreshold);
  });

  return (
    <div className="page-enter p-4 md:p-6 space-y-6">
      {/* Alert banner */}
      {alertStocks.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-3 flex items-center gap-3">
          <Activity className="w-5 h-5 text-amber-400 shrink-0 pulse-alert" />
          <div>
            <p className="text-amber-400 font-semibold text-sm">
              {alertStocks.length} stock{alertStocks.length > 1 ? 's' : ''} reached profit alert threshold!
            </p>
            <p className="text-amber-500/70 text-xs">
              {alertStocks.map((s) => s.name || s.ticker).join(', ')} — review your position
            </p>
          </div>
          <Link to="/stocks" className="ml-auto text-amber-400 hover:text-amber-300 shrink-0">
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Portfolio"
          value={fmtCurrency(totals.total, 'USD', true)}
          sub="All assets combined"
          icon={Activity}
          iconBg="bg-blue-500/20"
          iconColor="text-blue-400"
        />
        <MetricCard
          label="Stocks Value"
          value={fmtCurrency(totals.stocksVal, 'USD', true)}
          sub={`${stocks.length} positions`}
          icon={TrendingUp}
          iconBg="bg-cyan-500/20"
          iconColor="text-cyan-400"
        />
        <MetricCard
          label="Real Estate"
          value={fmtCurrency(totals.reVal, 'USD', true)}
          sub={`${realEstate.length} properties`}
          icon={Building2}
          iconBg="bg-purple-500/20"
          iconColor="text-purple-400"
        />
        <MetricCard
          label="Business"
          value={fmtCurrency(totals.bizVal, 'USD', true)}
          sub={`${business.length} ventures`}
          icon={Briefcase}
          iconBg="bg-emerald-500/20"
          iconColor="text-emerald-400"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Allocation */}
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl p-5 border border-slate-700/50">
          <h3 className="text-white font-semibold text-sm mb-4">Asset Allocation</h3>
          <AllocationChart data={allocation} />
        </div>

        {/* Growth */}
        <div className="lg:col-span-2 bg-slate-800 dark:bg-slate-900 rounded-xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Portfolio Growth</h3>
            <span className="text-slate-500 text-xs">Cumulative contributions</span>
          </div>
          <GrowthChart data={growthHistory} />
        </div>
      </div>

      {/* Stock P&L + Family */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stock Performance Bar */}
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Stock P&L %</h3>
            <Link to="/stocks" className="text-blue-400 text-xs hover:text-blue-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <StockBarChart data={stockPerformance} />
        </div>

        {/* Family quick view */}
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Family Equity</h3>
            <Link to="/family" className="text-blue-400 text-xs hover:text-blue-300 flex items-center gap-1">
              Details <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {memberData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No family members added yet.</p>
          ) : (
            <div className="space-y-3">
              {memberData.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                    style={{ backgroundColor: m.color || '#3b82f6' }}
                  >
                    {m.avatar || m.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-300 text-sm font-medium">{m.name}</span>
                      <span className="text-white text-sm font-bold num">
                        {fmtCurrency(m.netWorth, 'USD', true)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${m.ownershipPct}%`, backgroundColor: m.color || '#3b82f6' }}
                      />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-slate-600 text-xs">{fmtPct(m.ownershipPct, 1)}</span>
                      <span className="text-slate-600 text-xs">
                        {fmtCurrency(m.totalContribution, 'USD', true)} invested
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent activity row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top performer */}
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl p-5 border border-slate-700/50">
          <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Top Performer</h3>
          {topPerformer ? (
            <div>
              <p className="text-white font-bold text-base">{topPerformer.name || topPerformer.ticker}</p>
              <p className="text-slate-500 text-xs mb-2">{topPerformer.ticker}</p>
              <p className={`text-2xl font-bold num ${pnlColor(topPerformer.pnlPct)}`}>
                {fmtPct(topPerformer.pnlPct)}
              </p>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No stock data yet</p>
          )}
        </div>

        {/* RE yield */}
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl p-5 border border-slate-700/50">
          <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Real Estate Yield</h3>
          {realEstate.length > 0 ? (
            <>
              <p className="text-white font-bold text-2xl num">
                {fmtPct(
                  realEstate.reduce((sum, p) => sum + (p.annualizedROI || 0), 0) / realEstate.length,
                  1
                )}
              </p>
              <p className="text-slate-500 text-xs mt-1">Avg. annualized ROI</p>
              <p className="text-emerald-400 text-sm font-medium mt-2 num">
                {fmtCurrency(
                  realEstate.reduce((sum, p) => sum + (p.investmentAmount * p.annualizedROI / 100), 0),
                  'USD', true
                )} / yr
              </p>
            </>
          ) : (
            <p className="text-slate-500 text-sm">No properties yet</p>
          )}
        </div>

        {/* Members count */}
        <div className="bg-slate-800 dark:bg-slate-900 rounded-xl p-5 border border-slate-700/50">
          <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Family Members</h3>
          <p className="text-white font-bold text-2xl">{members.length}</p>
          <p className="text-slate-500 text-xs mt-1">{contributions.length} total contributions</p>
          <div className="flex -space-x-2 mt-3">
            {members.slice(0, 6).map((m) => (
              <div
                key={m.id}
                className="w-8 h-8 rounded-full border-2 border-slate-800 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: m.color || '#3b82f6' }}
                title={m.name}
              >
                {m.avatar || m.name[0]}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
