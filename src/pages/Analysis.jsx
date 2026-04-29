import { useState } from 'react';
import { Search, BarChart3, Loader, RefreshCw, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fetchStockAnalysis } from '../utils/stockApi';
import { ratingClass, fmt, fmtPct } from '../utils/calculations';
import toast from 'react-hot-toast';

const RATIO_DEFS = [
  { key: 'peRatio',        label: 'P/E Ratio',             fmt: (v) => fmt(v, 1),      desc: 'Price to Earnings — how much investors pay per $1 of earnings.' },
  { key: 'evEbitda',       label: 'EV/EBITDA',             fmt: (v) => fmt(v, 1),      desc: 'Enterprise Value vs operating earnings. Lower = potentially cheaper.' },
  { key: 'pbRatio',        label: 'P/B Ratio',             fmt: (v) => fmt(v, 2),      desc: 'Price to Book — market value vs book value. <1 may indicate undervaluation.' },
  { key: 'roe',            label: 'ROE',                   fmt: (v) => fmtPct(v * 100, 1), desc: 'Return on Equity — profitability relative to shareholders equity.' },
  { key: 'roa',            label: 'ROA',                   fmt: (v) => fmtPct(v * 100, 1), desc: 'Return on Assets — how efficiently assets generate profit.' },
  { key: 'netProfitMargin',label: 'Net Profit Margin',     fmt: (v) => fmtPct(v * 100, 1), desc: 'Percentage of revenue that becomes profit.' },
  { key: 'debtToEquity',   label: 'Debt / Equity',         fmt: (v) => fmt(v, 2),      desc: 'Financial leverage. Higher = more debt relative to equity.' },
  { key: 'currentRatio',   label: 'Current Ratio',         fmt: (v) => fmt(v, 2),      desc: 'Short-term liquidity. >1 means company can cover current obligations.' },
  { key: 'dividendYield',  label: 'Dividend Yield',        fmt: (v) => fmtPct(v * 100, 2), desc: 'Annual dividend as % of share price.' },
  { key: 'beta',           label: 'Beta',                  fmt: (v) => fmt(v, 2),      desc: 'Volatility vs market. >1 = more volatile, <1 = more stable.' },
];

function RatingBadge({ rating }) {
  if (!rating) return <span className="text-slate-500 text-xs">—</span>;
  const map = {
    buy: { label: 'BUY', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    strong_buy: { label: 'STRONG BUY', cls: 'bg-emerald-500/30 text-emerald-300 border-emerald-400/50' },
    hold: { label: 'HOLD', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    sell: { label: 'SELL', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
    strong_sell: { label: 'STRONG SELL', cls: 'bg-red-500/30 text-red-300 border-red-400/50' },
  };
  const r = map[rating.toLowerCase()] || { label: rating.toUpperCase(), cls: 'bg-slate-600/30 text-slate-300 border-slate-600' };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${r.cls}`}>
      {r.label}
    </span>
  );
}

function RatioRow({ def, value }) {
  const display = value !== null && value !== undefined ? def.fmt(value) : '—';
  return (
    <tr className="tr-hover border-b border-slate-700/50">
      <td className="px-4 py-3">
        <div>
          <p className="text-white text-sm font-medium">{def.label}</p>
          <p className="text-slate-500 text-xs mt-0.5">{def.desc}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`font-bold text-sm num ${value !== null ? 'text-white' : 'text-slate-500'}`}>
          {display}
        </span>
      </td>
    </tr>
  );
}

function IncomeTable({ data }) {
  if (!data?.length) return <p className="text-slate-500 text-sm">No annual data available.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left px-3 py-2 text-slate-400 text-xs">Year</th>
            <th className="text-right px-3 py-2 text-slate-400 text-xs">Revenue</th>
            <th className="text-right px-3 py-2 text-slate-400 text-xs">Gross Profit</th>
            <th className="text-right px-3 py-2 text-slate-400 text-xs">Net Income</th>
            <th className="text-right px-3 py-2 text-slate-400 text-xs">EBIT</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-slate-700/30 tr-hover">
              <td className="px-3 py-2 text-slate-300">{row.endDate?.slice(0, 4) || '—'}</td>
              <td className="px-3 py-2 text-right text-white num">{row.totalRevenue ? `$${(row.totalRevenue / 1e9).toFixed(2)}B` : '—'}</td>
              <td className="px-3 py-2 text-right text-white num">{row.grossProfit ? `$${(row.grossProfit / 1e9).toFixed(2)}B` : '—'}</td>
              <td className={`px-3 py-2 text-right num font-medium ${row.netIncome >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {row.netIncome !== undefined ? `${row.netIncome >= 0 ? '+' : ''}$${(row.netIncome / 1e9).toFixed(2)}B` : '—'}
              </td>
              <td className="px-3 py-2 text-right text-slate-300 num">{row.ebit ? `$${(row.ebit / 1e9).toFixed(2)}B` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Verdict({ ratios }) {
  const score = {
    pe: ratios.peRatio && ratios.peRatio < 20 ? 1 : ratios.peRatio > 40 ? -1 : 0,
    roe: ratios.roe && ratios.roe > 0.15 ? 1 : ratios.roe < 0 ? -1 : 0,
    margin: ratios.netProfitMargin && ratios.netProfitMargin > 0.1 ? 1 : ratios.netProfitMargin < 0 ? -1 : 0,
    debt: ratios.debtToEquity && ratios.debtToEquity < 100 ? 1 : ratios.debtToEquity > 200 ? -1 : 0,
    dividend: ratios.dividendYield && ratios.dividendYield > 0.02 ? 1 : 0,
  };
  const total = Object.values(score).reduce((s, v) => s + v, 0);

  let verdict, color, Icon;
  if (total >= 3) { verdict = 'BUY'; color = 'text-emerald-400'; Icon = TrendingUp; }
  else if (total >= 1) { verdict = 'HOLD'; color = 'text-amber-400'; Icon = Minus; }
  else { verdict = 'REVIEW / SELL'; color = 'text-red-400'; Icon = TrendingDown; }

  return (
    <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className={`font-bold text-lg ${color}`}>{verdict}</span>
        <span className="text-slate-400 text-sm">(Fundamental Score: {total}/5)</span>
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">
        {total >= 3
          ? 'Fundamentals appear strong. Low P/E, healthy ROE, and solid margins suggest the thesis remains intact. Monitor for valuation expansion.'
          : total >= 1
          ? 'Mixed fundamentals. The stock has some attractive metrics but also areas of concern. Continue holding but watch for deterioration.'
          : 'Weak fundamentals detected across multiple indicators. Consider reviewing your thesis and potentially reducing exposure.'}
      </p>
      <p className="text-slate-500 text-xs mt-2 italic">
        Note: This is an automated analysis based on available data. Always conduct your own research.
      </p>
    </div>
  );
}

export default function Analysis() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ratios');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!ticker.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await fetchStockAnalysis(ticker.trim().toUpperCase());
      if (result.error) throw new Error(result.error);
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to fetch analysis data');
      toast.error('Could not load analysis data. Check your ticker and try again.');
    } finally {
      setLoading(false);
    }
  };

  const TABS = [
    { id: 'ratios', label: '10 Key Ratios' },
    { id: 'income', label: 'Income Statement' },
    { id: 'verdict', label: 'Buy/Hold/Sell' },
    { id: 'profile', label: 'Company Profile' },
  ];

  return (
    <div className="page-enter p-4 md:p-6 space-y-6">
      {/* Search */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700/50">
        <h2 className="text-white font-semibold text-base mb-1">Stock Financial Analysis</h2>
        <p className="text-slate-400 text-sm mb-4">
          Analyze any stock — US, QSE (.QA suffix), or Tadawul (.SR suffix). Fetches live financial ratios and historical data.
        </p>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="Enter ticker: AAPL, QNBK.QA, 2222.SR, MSFT…"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white font-medium flex items-center gap-2"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
            Analyze
          </button>
        </form>
        <div className="flex flex-wrap gap-2 mt-3">
          {['AAPL', 'MSFT', 'NVDA', 'QNBK.QA', '2222.SR', 'GOOGL'].map((t) => (
            <button
              key={t}
              onClick={() => setTicker(t)}
              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-slate-300 text-xs"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-slate-400 text-sm">Fetching financial data for {ticker}…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-center">
          <p className="text-red-400 font-medium">{error}</p>
          <p className="text-slate-500 text-sm mt-1">Make sure the ticker is correct (e.g., QNBK.QA for QSE stocks)</p>
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-white font-bold text-xl">{data.ticker}</h2>
                <RatingBadge rating={data.ratios?.recommendation} />
              </div>
              <p className="text-slate-400 text-sm">{data.ratios?.sector} · {data.ratios?.industry}</p>
              {data.ratios?.targetPrice && (
                <p className="text-slate-500 text-xs mt-1">
                  Analyst target: <span className="text-blue-400 font-medium">${data.ratios.targetPrice.toFixed(2)}</span>
                </p>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Ratios */}
          {activeTab === 'ratios' && (
            <div className="bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700">
                <h3 className="text-white font-semibold text-sm">10 Key Financial Ratios</h3>
                <p className="text-slate-500 text-xs mt-0.5">Based on latest available data from Yahoo Finance</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left px-4 py-2.5 text-slate-400 text-xs font-medium uppercase tracking-wider">Metric</th>
                    <th className="text-right px-4 py-2.5 text-slate-400 text-xs font-medium uppercase tracking-wider">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {RATIO_DEFS.map((def) => (
                    <RatioRow key={def.key} def={def} value={data.ratios?.[def.key]} />
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 bg-slate-700/20 border-t border-slate-700">
                <p className="text-slate-500 text-xs">
                  Data sourced from Yahoo Finance. Forward-looking metrics may vary. Always verify with primary sources.
                </p>
              </div>
            </div>
          )}

          {/* Tab: Income Statement */}
          {activeTab === 'income' && (
            <div className="bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700">
                <h3 className="text-white font-semibold text-sm">Annual Income Statement</h3>
                <p className="text-slate-500 text-xs mt-0.5">Last 4 fiscal years (in billions USD)</p>
              </div>
              <div className="p-5">
                <IncomeTable data={data.annualIS} />
              </div>
            </div>
          )}

          {/* Tab: Verdict */}
          {activeTab === 'verdict' && (
            <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-5 space-y-4">
              <h3 className="text-white font-semibold text-sm">Buy / Hold / Sell Analysis</h3>
              <Verdict ratios={data.ratios || {}} />

              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-700 rounded-lg overflow-hidden">
                  <thead className="bg-slate-700/40">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-slate-400 text-xs">Signal</th>
                      <th className="text-left px-4 py-2.5 text-slate-400 text-xs">Metric</th>
                      <th className="text-right px-4 py-2.5 text-slate-400 text-xs">Value</th>
                      <th className="text-left px-4 py-2.5 text-slate-400 text-xs">Reading</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {[
                      { metric: 'P/E Ratio', value: data.ratios?.peRatio, bullish: (v) => v < 20, bearish: (v) => v > 40, note: (v) => v < 20 ? 'Cheap vs earnings' : v > 40 ? 'Priced for perfection' : 'Fairly valued' },
                      { metric: 'ROE', value: data.ratios?.roe != null ? data.ratios.roe * 100 : null, bullish: (v) => v > 15, bearish: (v) => v < 0, note: (v) => v > 15 ? 'Strong returns on equity' : v < 0 ? 'Negative ROE — loss-making' : 'Below industry average' },
                      { metric: 'Net Margin', value: data.ratios?.netProfitMargin != null ? data.ratios.netProfitMargin * 100 : null, bullish: (v) => v > 10, bearish: (v) => v < 0, note: (v) => v > 10 ? 'Healthy profit margins' : v < 0 ? 'Losing money per sale' : 'Thin margins' },
                      { metric: 'Debt/Equity', value: data.ratios?.debtToEquity, bullish: (v) => v < 50, bearish: (v) => v > 200, note: (v) => v < 50 ? 'Low leverage, healthy' : v > 200 ? 'High debt load' : 'Moderate leverage' },
                      { metric: 'Dividend Yield', value: data.ratios?.dividendYield != null ? data.ratios.dividendYield * 100 : null, bullish: (v) => v > 2, bearish: () => false, note: (v) => v > 2 ? 'Pays a decent dividend' : 'Low/no dividend' },
                    ].map(({ metric, value, bullish, bearish, note }) => {
                      const isBull = value != null && bullish(value);
                      const isBear = value != null && bearish(value);
                      return (
                        <tr key={metric} className="tr-hover">
                          <td className="px-4 py-2.5">
                            {isBull ? <TrendingUp className="w-4 h-4 text-emerald-400" /> :
                             isBear ? <TrendingDown className="w-4 h-4 text-red-400" /> :
                             <Minus className="w-4 h-4 text-amber-400" />}
                          </td>
                          <td className="px-4 py-2.5 text-slate-300 text-sm">{metric}</td>
                          <td className="px-4 py-2.5 text-right text-white font-medium num text-sm">
                            {value != null ? value.toFixed(2) : '—'}
                          </td>
                          <td className={`px-4 py-2.5 text-xs ${isBull ? 'text-emerald-400' : isBear ? 'text-red-400' : 'text-amber-400'}`}>
                            {value != null ? note(value) : 'Data unavailable'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Profile */}
          {activeTab === 'profile' && (
            <div className="bg-slate-800 rounded-xl border border-slate-700/50 p-5 space-y-4">
              <h3 className="text-white font-semibold text-sm">Company Profile</h3>
              {data.ratios?.description ? (
                <p className="text-slate-300 text-sm leading-relaxed">{data.ratios.description}</p>
              ) : (
                <p className="text-slate-500 text-sm">No description available.</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {[
                  { label: 'Sector', value: data.ratios?.sector },
                  { label: 'Industry', value: data.ratios?.industry },
                  { label: 'Country', value: data.ratios?.country },
                  { label: 'Revenue', value: data.ratios?.revenue ? `$${(data.ratios.revenue / 1e9).toFixed(1)}B` : null },
                  { label: 'Gross Margin', value: data.ratios?.grossMargins != null ? fmtPct(data.ratios.grossMargins * 100) : null },
                  { label: 'Op. Margin', value: data.ratios?.operatingMargins != null ? fmtPct(data.ratios.operatingMargins * 100) : null },
                  { label: 'Revenue Growth', value: data.ratios?.revenueGrowth != null ? fmtPct(data.ratios.revenueGrowth * 100) : null },
                  { label: 'Earnings Growth', value: data.ratios?.earningsGrowth != null ? fmtPct(data.ratios.earningsGrowth * 100) : null },
                ].filter((i) => i.value).map(({ label, value }) => (
                  <div key={label} className="bg-slate-700/40 rounded-lg p-3">
                    <p className="text-slate-400 text-xs">{label}</p>
                    <p className="text-white font-medium text-sm mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
