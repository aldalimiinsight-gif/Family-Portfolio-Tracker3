import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Building2, Briefcase, Users, ArrowRight, Bell, ChevronRight } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { useStockPrices } from '../hooks/useStockPrices';
import {
  calcTotalPortfolioValue, calcAllocation, calcMemberContributions,
  calcMemberNetWorth, buildGrowthHistory, calcStockMetrics,
  fmtCurrency, fmtPct, pnlColor,
} from '../utils/calculations';
import AllocationChart from '../components/charts/AllocationChart';
import GrowthChart from '../components/charts/GrowthChart';
import StockBarChart from '../components/charts/StockBarChart';

/* ── Metric card ──────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, color = '#d4a017', bgColor, icon: Icon }) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(11,21,40,0.95), rgba(8,14,28,0.9))',
        border: `1px solid ${color}18`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.45), 0 0 0 1px ${color}08`,
      }}
    >
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color}15 0%, transparent 70%)` }}
      />
      <div className="flex items-start gap-3 relative z-10">
        <div
          className="icon-pill shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="section-label mb-1.5">{label}</p>
          <p className="text-white font-bold text-xl num leading-none">{value}</p>
          {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Ownership avatars pill ────────────────────────────────────────────── */
function OwnerPills({ owners = [], members = [], compact = false }) {
  if (!owners?.length) return null;
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {owners.map((o) => {
        const m = members.find((mem) => mem.id === o.memberId);
        if (!m) return null;
        return (
          <span key={o.memberId} className="ownership-pill">
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
              style={{ background: m.color || '#d4a017' }}
            >
              {m.avatar || m.name[0]}
            </span>
            {!compact && m.name}
            {' '}{o.ownershipPct}%
          </span>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { state } = usePortfolio();
  useStockPrices();

  const { stocks, realEstate, business, members, contributions, settings, prices } = state;

  const totals = useMemo(() => calcTotalPortfolioValue(state, prices), [state, prices]);

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

  /* Collect all assets with assigned owners for the ownership table */
  const ownedAssets = useMemo(() => {
    const rows = [];
    stocks.forEach((s) => {
      if (s.owners?.length) {
        const live = prices?.[s.ticker];
        const { currentValueUSD } = calcStockMetrics(s, live, settings.exchangeRates);
        rows.push({ type: 'Stock', name: s.name || s.ticker, value: currentValueUSD, owners: s.owners, color: '#60a5fa' });
      }
    });
    realEstate.forEach((p) => {
      if (p.owners?.length) {
        rows.push({ type: 'Real Estate', name: p.propertyName, value: p.investmentAmount || 0, owners: p.owners, color: '#a78bfa' });
      }
    });
    business.forEach((b) => {
      if (b.owners?.length) {
        const val = b.currentValuation && b.ownershipPercent ? (b.currentValuation * b.ownershipPercent) / 100 : b.capitalInvested || 0;
        rows.push({ type: 'Business', name: b.businessName, value: val, owners: b.owners, color: '#34d399' });
      }
    });
    return rows.sort((a, b) => b.value - a.value).slice(0, 6);
  }, [stocks, realEstate, business, prices, settings.exchangeRates]);

  return (
    <div className="page-enter p-4 md:p-6 space-y-5">

      {/* ── Alert Banner ──────────────────────────────────────────────── */}
      {alertStocks.length > 0 && (
        <div
          className="rounded-xl px-5 py-3.5 flex items-center gap-3"
          style={{
            background: 'linear-gradient(90deg, rgba(212,160,23,0.12), rgba(212,160,23,0.04))',
            border: '1px solid rgba(212,160,23,0.25)',
          }}
        >
          <Bell className="w-4 h-4 pulse-alert shrink-0" style={{ color: '#d4a017' }} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm" style={{ color: '#f5d060' }}>
              {alertStocks.length} position{alertStocks.length > 1 ? 's' : ''} reached your profit alert
            </p>
            <p className="text-xs text-slate-500 truncate">
              {alertStocks.map((s) => s.name || s.ticker).join(' · ')}
            </p>
          </div>
          <Link to="/stocks" className="shrink-0 transition-colors" style={{ color: '#d4a017' }}>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ── Hero: Total Portfolio ──────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0d1b2e 0%, #070d1c 100%)',
          border: '1px solid rgba(212,160,23,0.2)',
          boxShadow: '0 0 60px rgba(212,160,23,0.06), 0 4px 32px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="absolute -top-20 -right-20 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,160,23,0.1) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)' }}
        />

        <div className="relative z-10">
          <p className="section-label mb-3">Total Portfolio Value</p>
          <p
            className="font-bold num leading-none mb-4"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              background: 'linear-gradient(135deg, #ffffff 0%, #c2d4e6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {fmtCurrency(totals.total)}
          </p>

          {/* Allocation bars */}
          <div className="flex gap-1 h-2 rounded-full overflow-hidden w-full max-w-sm mb-3">
            {[
              { val: totals.stocksVal, color: '#60a5fa' },
              { val: totals.reVal,    color: '#a78bfa' },
              { val: totals.bizVal,   color: '#34d399' },
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

          <div className="flex flex-wrap gap-5 text-xs text-slate-400">
            {[
              { label: 'Stocks',      val: totals.stocksVal, color: '#60a5fa' },
              { label: 'Real Estate', val: totals.reVal,     color: '#a78bfa' },
              { label: 'Business',    val: totals.bizVal,    color: '#34d399' },
            ].map((seg) => (
              <span key={seg.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: seg.color }} />
                {seg.label}: <strong className="text-slate-200 num">{fmtCurrency(seg.val, 'USD', true)}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Stock Portfolio"  value={fmtCurrency(totals.stocksVal, 'USD', true)} sub={`${stocks.length} positions`}      icon={TrendingUp} color="#60a5fa" />
        <KpiCard label="Real Estate"      value={fmtCurrency(totals.reVal,     'USD', true)} sub={`${realEstate.length} properties`}  icon={Building2}  color="#a78bfa" />
        <KpiCard label="Business"         value={fmtCurrency(totals.bizVal,    'USD', true)} sub={`${business.length} ventures`}      icon={Briefcase}  color="#34d399" />
        <KpiCard label="Family Members"   value={`${members.length}`}                        sub={`${contributions.length} entries`}  icon={Users}      color="#d4a017" />
      </div>

      {/* ── Charts Row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5">
          <p className="text-white font-semibold text-sm mb-4">Asset Allocation</p>
          <AllocationChart data={allocation} />
        </div>
        <div className="card lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-semibold text-sm">Portfolio Growth</p>
            <span className="text-slate-500 text-xs">Cumulative contributions</span>
          </div>
          <GrowthChart data={growthHistory} />
        </div>
      </div>

      {/* ── Stock P&L + Family ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Stock performance */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-semibold text-sm">Stock Performance</p>
            <Link to="/stocks" className="text-xs flex items-center gap-1 transition-colors" style={{ color: '#d4a017' }}>
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <StockBarChart data={stockPerformance} />
        </div>

        {/* Family equity */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-semibold text-sm">Family Equity</p>
            <Link to="/family" className="text-xs flex items-center gap-1 transition-colors" style={{ color: '#d4a017' }}>
              Details <ChevronRight className="w-3 h-3" />
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
                    style={{
                      background: `linear-gradient(135deg, ${m.color || '#d4a017'}, ${m.color || '#d4a017'}99)`,
                      boxShadow: `0 0 10px ${m.color || '#d4a017'}33`,
                    }}
                  >
                    {m.avatar || m.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-200 text-sm font-medium">{m.name}</span>
                      <span className="text-white text-sm font-bold num">{fmtCurrency(m.netWorth, 'USD', true)}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${m.ownershipPct}%`,
                          background: `linear-gradient(90deg, ${m.color || '#d4a017'}, ${m.color || '#d4a017'}88)`,
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

      {/* ── Asset Ownership Overview ──────────────────────────────────── */}
      {ownedAssets.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-semibold text-sm">Asset Ownership Overview</p>
            <span className="text-slate-500 text-xs">Fractional family stakes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th className="text-left pb-3 section-label">Asset</th>
                  <th className="text-left pb-3 section-label">Type</th>
                  <th className="text-right pb-3 section-label hidden sm:table-cell">Value</th>
                  <th className="text-left pb-3 section-label">Owners</th>
                </tr>
              </thead>
              <tbody>
                {ownedAssets.map((asset, idx) => (
                  <tr key={idx} className="tr-hover" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                    <td className="py-3 pr-4">
                      <p className="text-white text-sm font-medium truncate max-w-[160px]">{asset.name}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: `${asset.color}15`,
                          color: asset.color,
                          border: `1px solid ${asset.color}30`,
                        }}
                      >
                        {asset.type}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right hidden sm:table-cell">
                      <span className="text-slate-300 text-sm num">{fmtCurrency(asset.value, 'USD', true)}</span>
                    </td>
                    <td className="py-3">
                      <OwnerPills owners={asset.owners} members={members} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Bottom Stat Cards ──────────────────────────────────────────── */}
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
            <>
              <p className="text-white font-bold text-base">{topPerformer.name || topPerformer.ticker}</p>
              <p className="text-slate-500 text-xs mb-3">{topPerformer.ticker}</p>
              <p
                className={`text-3xl font-bold num ${pnlColor(topPerformer.pnlPct)}`}
                style={{ textShadow: topPerformer.pnlPct > 0 ? '0 0 24px rgba(52,211,153,0.3)' : undefined }}
              >
                {fmtPct(topPerformer.pnlPct)}
              </p>
            </>
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
                className="text-3xl font-bold num"
                style={{ color: '#34d399', textShadow: '0 0 24px rgba(52,211,153,0.25)' }}
              >
                {fmtPct(
                  realEstate.reduce((s, p) => s + (p.annualizedROI || 0), 0) / realEstate.length,
                  1
                )}
              </p>
              <p className="text-slate-500 text-xs mt-1">Avg. annualized ROI</p>
              <p className="text-sm font-medium mt-2 num" style={{ color: '#6ee7b7' }}>
                {fmtCurrency(
                  realEstate.reduce((s, p) => s + (p.investmentAmount * p.annualizedROI / 100), 0),
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
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold"
                style={{
                  background: `linear-gradient(135deg, ${m.color || '#d4a017'}, ${m.color || '#d4a017'}99)`,
                  borderColor: '#060b18',
                }}
                title={m.name}
              >
                {m.avatar || m.name[0]}
              </div>
            ))}
            {members.length > 7 && (
              <div
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-slate-400 text-xs font-bold"
                style={{ background: '#102035', borderColor: '#060b18' }}
              >
                +{members.length - 7}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

