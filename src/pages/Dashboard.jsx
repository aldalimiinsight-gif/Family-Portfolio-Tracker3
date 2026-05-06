import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Building2, Briefcase, Users, ArrowRight, Activity, Bell } from 'lucide-react';
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
    <div className="page-enter p-4 md:p-6 space-y-5">

      {/* ── Alert Banner ─────────────────────────────────────────────── */}
      {alertStocks.length > 0 && (
        <div
          className="rounded-xl px-5 py-3.5 flex items-center gap-3"
          style={{
            background: 'linear-gradient(90deg, rgba(245,158,11,0.12), rgba(245,158,11,0.06))',
            border: '1px solid rgba(245,158,11,0.25)',
          }}
        >
          <Bell className="w-4 h-4 text-amber-400 shrink-0 pulse-alert" />
          <div className="flex-1 min-w-0">
            <p className="text-amber-300 font-semibold text-sm">
              {alertStocks.length} position{alertStocks.length > 1 ? 's' : ''} hit your profit alert
            </p>
            <p className="text-amber-500/70 text-xs truncate">
              {alertStocks.map((s) => s.name || s.ticker).join(' · ')}
            </p>
          </div>
          <Link to="/stocks" className="text-amber-400 hover:text-amber-300 shrink-0 transition-colors">
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ── Hero: Total Portfolio ─────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0d1a30 0%, #080e20 100%)',
          border: '1px solid rgba(99,102,241,0.18)',
          boxShadow: '0 0 60px rgba(99,102,241,0.08), 0 4px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Decorative glow orb */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)' }}
        />

        <div className="relative z-10">
          <p className="section-label mb-3">Total Portfolio Value</p>
          <p
            className="font-bold num leading-none mb-4"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              background: 'linear-gradient(135deg, #ffffff 0%, #94b3cc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {fmtCurrency(totals.total)}
          </p>

          {/* Mini allocation bars */}
          <div className="flex gap-1 h-1.5 rounded-full overflow-hidden w-full max-w-sm mb-3">
            {[
              { val: totals.stocksVal, color: '#3b82f6' },
              { val: totals.reVal,    color: '#8b5cf6' },
              { val: totals.bizVal,   color: '#10b981' },
            ].map((seg, i) => {
              const pct = totals.total > 0 ? (seg.val / totals.total) * 100 : 0;
              return pct > 0 ? (
                <div
                  key={i}
                  className="h-full rounded-sm transition-all duration-700"
                  style={{ width: `${pct}%`, background: seg.color }}
                />
              ) : null;
            })}
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            {[
              { label: 'Stocks', val: totals.stocksVal, color: '#3b82f6' },
              { label: 'Real Estate', val: totals.reVal, color: '#8b5cf6' },
              { label: 'Business', val: totals.bizVal, color: '#10b981' },
            ].map((seg) => (
              <span key={seg.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: seg.color }} />
                {seg.label}: <strong className="text-slate-200 num">{fmtCurrency(seg.val, 'USD', true)}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Stock Portfolio"
          value={fmtCurrency(totals.stocksVal, 'USD', true)}
          sub={`${stocks.length} positions`}
          icon={TrendingUp}
          variant="blue"
        />
        <MetricCard
          label="Real Estate"
          value={fmtCurrency(totals.reVal, 'USD', true)}
          sub={`${realEstate.length} properties`}
          icon={Building2}
          variant="violet"
        />
        <MetricCard
          label="Business"
          value={fmtCurrency(totals.bizVal, 'USD', true)}
          sub={`${business.length} ventures`}
          icon={Briefcase}
          variant="emerald"
        />
        <MetricCard
          label="Family Members"
          value={`${members.length}`}
          sub={`${contributions.length} contributions`}
          icon={Users}
          variant="amber"
        />
      </div>

      {/* ── Charts Row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Allocation */}
        <div className="card p-5">
          <p className="text-white font-semibold text-sm mb-4">Asset Allocation</p>
          <AllocationChart data={allocation} />
        </div>

        {/* Growth */}
        <div className="card lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-semibold text-sm">Portfolio Growth</p>
            <span className="text-slate-500 text-xs">Cumulative contributions</span>
          </div>
          <GrowthChart data={growthHistory} />
        </div>
      </div>

      {/* ── Stock P&L + Family ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Stock P&L bar */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-semibold text-sm">Stock Performance</p>
            <Link to="/stocks" className="text-indigo-400 text-xs hover:text-indigo-300 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <StockBarChart data={stockPerformance} />
        </div>

        {/* Family equity */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-semibold text-sm">Family Equity</p>
            <Link to="/family" className="text-indigo-400 text-xs hover:text-indigo-300 flex items-center gap-1 transition-colors">
              Details <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {memberData.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No family members added yet.</p>
          ) : (
            <div className="space-y-3">
              {memberData.map((m) => (
                <div key={m.id} className="flex items-center gap-3 group">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${m.color || '#6366f1'}, ${m.color || '#6366f1'}99)`,
                      boxShadow: `0 0 12px ${m.color || '#6366f1'}44`,
                    }}
                  >
                    {m.avatar || m.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-200 text-sm font-medium">{m.name}</span>
                      <span className="text-white text-sm font-bold num">{fmtCurrency(m.netWorth, 'USD', true)}</span>
                    </div>
                    <div className="h-1 bg-slate-700/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${m.ownershipPct}%`,
                          background: `linear-gradient(90deg, ${m.color || '#6366f1'}, ${m.color || '#6366f1'}88)`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-slate-600 text-xs">{fmtPct(m.ownershipPct, 1)}</span>
                      <span className="text-slate-600 text-xs num">{fmtCurrency(m.totalContribution, 'USD', true)} in</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top performer */}
        <div
          className="rounded-xl p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(11,21,40,0.95), rgba(8,14,28,0.9))',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p className="section-label mb-3">Top Performer</p>
          {topPerformer ? (
            <div>
              <p className="text-white font-bold text-base leading-tight">{topPerformer.name || topPerformer.ticker}</p>
              <p className="text-slate-500 text-xs mb-3">{topPerformer.ticker}</p>
              <p
                className={`text-3xl font-bold num ${pnlColor(topPerformer.pnlPct)}`}
                style={{ textShadow: topPerformer.pnlPct > 0 ? '0 0 24px rgba(52,211,153,0.3)' : undefined }}
              >
                {fmtPct(topPerformer.pnlPct)}
              </p>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No stock data yet</p>
          )}
        </div>

        {/* RE yield */}
        <div
          className="rounded-xl p-5"
          style={{
            background: 'linear-gradient(145deg, rgba(11,21,40,0.95), rgba(8,14,28,0.9))',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p className="section-label mb-3">Real Estate Yield</p>
          {realEstate.length > 0 ? (
            <>
              <p
                className="text-emerald-400 text-3xl font-bold num"
                style={{ textShadow: '0 0 24px rgba(52,211,153,0.25)' }}
              >
                {fmtPct(
                  realEstate.reduce((sum, p) => sum + (p.annualizedROI || 0), 0) / realEstate.length,
                  1
                )}
              </p>
              <p className="text-slate-500 text-xs mt-1">Avg. annualized ROI</p>
              <p className="text-emerald-400/70 text-sm font-medium mt-2 num">
                {fmtCurrency(
                  realEstate.reduce((sum, p) => sum + (p.investmentAmount * p.annualizedROI / 100), 0),
                  'USD', true
                )}/yr
              </p>
            </>
          ) : (
            <p className="text-slate-500 text-sm">No properties yet</p>
          )}
        </div>

        {/* Members */}
        <div
          className="rounded-xl p-5"
          style={{
            background: 'linear-gradient(145deg, rgba(11,21,40,0.95), rgba(8,14,28,0.9))',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <p className="section-label mb-3">Family Members</p>
          <p className="text-white font-bold text-3xl">{members.length}</p>
          <p className="text-slate-500 text-xs mt-1">{contributions.length} total contributions</p>
          <div className="flex -space-x-2 mt-4">
            {members.slice(0, 7).map((m) => (
              <div
                key={m.id}
                className="w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-white text-xs font-bold"
                style={{ background: `linear-gradient(135deg, ${m.color || '#6366f1'}, ${m.color || '#6366f1'}99)` }}
                title={m.name}
              >
                {m.avatar || m.name[0]}
              </div>
            ))}
            {members.length > 7 && (
              <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-bold">
                +{members.length - 7}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
