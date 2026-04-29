import { useRef, useMemo } from 'react';
import { FileText, Download, TrendingUp, Building2, Briefcase, Users, Activity } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import {
  calcTotalPortfolioValue, calcMemberContributions, calcMemberNetWorth,
  calcStockMetrics, calcAllocation, fmtCurrency, fmtPct, pnlColor,
} from '../utils/calculations';
import { generateExecutiveSummaryPDF } from '../utils/reportGenerator';
import AllocationChart from '../components/charts/AllocationChart';
import FamilyOwnershipChart from '../components/charts/FamilyOwnershipChart';
import toast from 'react-hot-toast';

export default function Reports() {
  const { state } = usePortfolio();
  const { stocks, realEstate, business, members, contributions, settings, prices } = state;
  const reportRef = useRef(null);

  const totals = useMemo(() => calcTotalPortfolioValue(state, prices), [state, prices]);
  const allocation = useMemo(() => calcAllocation(totals.stocksVal, totals.reVal, totals.bizVal), [totals]);

  const memberData = useMemo(() =>
    calcMemberContributions(contributions, members).map((m) => ({
      ...m,
      netWorth: calcMemberNetWorth(m, totals.total),
    })),
    [contributions, members, totals.total]
  );

  const stockMetrics = useMemo(() =>
    stocks.map((s) => {
      const live = prices?.[s.ticker];
      const m = calcStockMetrics(s, live, settings.exchangeRates);
      return { ...s, ...m };
    }).sort((a, b) => b.unrealizedPnLPct - a.unrealizedPnLPct),
    [stocks, prices, settings.exchangeRates]
  );

  const topPerformer = stockMetrics[0];
  const worstPerformer = stockMetrics[stockMetrics.length - 1];

  const totalRealEstateIncome = useMemo(() =>
    realEstate.reduce((s, p) => s + (p.investmentAmount || 0) * (p.annualizedROI || 0) / 100, 0),
    [realEstate]
  );

  const handleDownloadPDF = () => {
    try {
      generateExecutiveSummaryPDF({ state, prices, memberData, totals });
      toast.success('Report downloaded!');
    } catch (err) {
      toast.error('Failed to generate PDF');
    }
  };

  const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="page-enter p-4 md:p-6 space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-bold text-lg">Executive Summary Report</h2>
          <p className="text-slate-500 text-sm">Generated: {reportDate}</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      {/* Report body */}
      <div ref={reportRef} className="space-y-6">
        {/* Header card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-2xl gradient-text">Family Office Portfolio</h1>
              <p className="text-slate-400 text-sm mt-0.5">Confidential — Internal Use Only · {reportDate}</p>
            </div>
          </div>

          {/* Big numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Portfolio Value', value: fmtCurrency(totals.total, 'USD', false), color: 'text-white', sub: 'All assets' },
              { label: 'Stocks', value: fmtCurrency(totals.stocksVal, 'USD', true), color: 'text-blue-400', sub: `${stocks.length} positions` },
              { label: 'Real Estate', value: fmtCurrency(totals.reVal, 'USD', true), color: 'text-purple-400', sub: `${realEstate.length} properties` },
              { label: 'Business', value: fmtCurrency(totals.bizVal, 'USD', true), color: 'text-emerald-400', sub: `${business.length} ventures` },
            ].map((item) => (
              <div key={item.label} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                <p className="text-slate-400 text-xs uppercase tracking-wider">{item.label}</p>
                <p className={`font-bold text-xl mt-1 num ${item.color}`}>{item.value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
            <h3 className="text-white font-semibold text-sm mb-3">Asset Allocation</h3>
            <AllocationChart data={allocation} />
          </div>
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
            <h3 className="text-white font-semibold text-sm mb-3">Family Ownership</h3>
            <FamilyOwnershipChart data={memberData} />
          </div>
        </div>

        {/* Performance highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider">Top Performer</h3>
            </div>
            {topPerformer ? (
              <>
                <p className="text-white font-bold text-base">{topPerformer.name || topPerformer.ticker}</p>
                <p className="text-slate-500 text-xs mb-1">{topPerformer.ticker}</p>
                <p className={`text-2xl font-bold num ${pnlColor(topPerformer.unrealizedPnLPct)}`}>
                  {fmtPct(topPerformer.unrealizedPnLPct)}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  P&L: {fmtCurrency(topPerformer.unrealizedPnL, 'USD', true)}
                </p>
              </>
            ) : <p className="text-slate-500 text-sm">No data</p>}
          </div>

          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-purple-400" />
              <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider">Real Estate Income</h3>
            </div>
            <p className={`text-2xl font-bold num ${totalRealEstateIncome > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
              {fmtCurrency(totalRealEstateIncome, 'USD', true)}/yr
            </p>
            <p className="text-slate-500 text-xs mt-1">{fmtCurrency(totalRealEstateIncome / 12, 'USD', true)}/month estimated</p>
            {realEstate.length > 0 && (
              <p className="text-slate-400 text-xs mt-2">
                Avg ROI: {fmtPct(realEstate.reduce((s, p) => s + p.annualizedROI, 0) / realEstate.length, 1)}
              </p>
            )}
          </div>

          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider">Business Portfolio</h3>
            </div>
            <p className="text-white font-bold text-2xl num">{fmtCurrency(totals.bizVal, 'USD', true)}</p>
            <p className="text-slate-500 text-xs mt-1">{business.length} investment{business.length !== 1 ? 's' : ''}</p>
            {business.length > 0 && (
              <p className="text-slate-400 text-xs mt-2">
                Avg. stake: {(business.reduce((s, b) => s + b.ownershipPercent, 0) / business.length).toFixed(1)}%
              </p>
            )}
          </div>
        </div>

        {/* Stock positions table */}
        {stockMetrics.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <h3 className="text-white font-semibold text-sm">Stock Portfolio Snapshot</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    {['Company', 'Exchange', 'Shares', 'Cost Basis', 'Market Value', 'P&L', 'P&L %'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {stockMetrics.map((s) => (
                    <tr key={s.id} className="tr-hover">
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{s.name || s.ticker}</p>
                        <p className="text-slate-500 text-xs">{s.ticker}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{s.exchange}</td>
                      <td className="px-4 py-3 text-slate-300 num">{s.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-300 num">{fmtCurrency(s.costBasisUSD, 'USD', true)}</td>
                      <td className="px-4 py-3 text-white font-medium num">{fmtCurrency(s.currentValueUSD, 'USD', true)}</td>
                      <td className={`px-4 py-3 font-medium num ${pnlColor(s.unrealizedPnL)}`}>
                        {s.unrealizedPnL >= 0 ? '+' : ''}{fmtCurrency(s.unrealizedPnL, 'USD', true)}
                      </td>
                      <td className={`px-4 py-3 font-bold num ${pnlColor(s.unrealizedPnLPct)}`}>
                        {fmtPct(s.unrealizedPnLPct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Family breakdown */}
        {memberData.length > 0 && (
          <div className="bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <h3 className="text-white font-semibold text-sm">What Each Member Owns</h3>
                <span className="text-slate-500 text-xs ml-2">Plain language breakdown</span>
              </div>
            </div>
            <div className="divide-y divide-slate-700/30">
              {memberData.map((m) => (
                <div key={m.id} className="px-5 py-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.avatar || m.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-white font-semibold">{m.name}</h4>
                        <span className="text-emerald-400 font-bold num">{fmtCurrency(m.netWorth, 'USD', false)}</span>
                      </div>
                      <p className="text-slate-400 text-sm">
                        {m.name} owns <strong className="text-white">{fmtPct(m.ownershipPct, 1)}</strong> of the family fund,
                        representing a net worth of <strong className="text-emerald-400">{fmtCurrency(m.netWorth, 'USD', true)}</strong>.
                        They have contributed a total of <strong className="text-white">{fmtCurrency(m.totalContribution, 'USD', true)}</strong> to the portfolio.
                      </p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full ml-12">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(m.ownershipPct, 100)}%`, backgroundColor: m.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer note */}
        <div className="text-center py-4 border-t border-slate-700">
          <p className="text-slate-600 text-xs">
            This report is confidential and intended for family members only.
            All values are estimates and may not reflect real-time market prices.
          </p>
        </div>
      </div>
    </div>
  );
}
