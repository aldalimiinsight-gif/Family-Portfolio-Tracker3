import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, TrendingUp, AlertTriangle, Search, SlidersHorizontal } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { useStockPrices } from '../hooks/useStockPrices';
import { calcStockMetrics, fmtCurrency, fmtPct, pnlBg, pnlColor } from '../utils/calculations';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';

const EXCHANGES = ['US', 'QSE', 'Tadawul'];
const CURRENCIES = ['USD', 'QAR', 'SAR', 'GBP', 'EUR'];

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const defaultForm = {
  ticker: '', exchange: 'US', name: '', purchaseDate: '',
  purchasePrice: '', quantity: '', currency: 'USD', alertThreshold: 30,
};

export default function Stocks() {
  const { state, dispatch } = usePortfolio();
  const { refreshTicker, refreshAll } = useStockPrices();
  const { stocks, prices, settings } = state;

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [search, setSearch] = useState('');
  const [filterExchange, setFilterExchange] = useState('All');
  const [alertThreshold, setAlertThreshold] = useState(settings.alertThreshold);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const openAdd = () => { setEditing(null); setForm(defaultForm); setModal(true); };
  const openEdit = (stock) => {
    setEditing(stock.id);
    setForm({ ...stock });
    setModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const stock = {
      ...form,
      purchasePrice: parseFloat(form.purchasePrice),
      quantity: parseFloat(form.quantity),
      alertThreshold: parseFloat(form.alertThreshold) || alertThreshold,
    };

    if (!stock.ticker || !stock.purchasePrice || !stock.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Auto-append exchange suffix
    if (stock.exchange === 'QSE' && !stock.ticker.endsWith('.QA')) {
      stock.ticker = `${stock.ticker.toUpperCase()}.QA`;
    } else if (stock.exchange === 'Tadawul' && !stock.ticker.endsWith('.SR')) {
      stock.ticker = `${stock.ticker.toUpperCase()}.SR`;
    } else {
      stock.ticker = stock.ticker.toUpperCase();
    }

    if (editing) {
      dispatch({ type: 'UPDATE_STOCK', payload: { ...stock, id: editing } });
      toast.success('Stock updated');
    } else {
      dispatch({ type: 'ADD_STOCK', payload: { ...stock, id: genId() } });
      toast.success('Stock added');
      setTimeout(() => refreshTicker(stock.ticker), 500);
    }
    setModal(false);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this stock position?')) {
      dispatch({ type: 'DELETE_STOCK', payload: id });
      toast.success('Position removed');
    }
  };

  const saveAlertThreshold = () => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { alertThreshold } });
    toast.success('Alert threshold saved');
    setSettingsOpen(false);
  };

  const filtered = useMemo(() => {
    return stocks.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.ticker.toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q);
      const matchExch = filterExchange === 'All' || s.exchange === filterExchange;
      return matchSearch && matchExch;
    });
  }, [stocks, search, filterExchange]);

  const totals = useMemo(() => {
    let costTotal = 0, valueTotal = 0;
    stocks.forEach((s) => {
      const live = prices?.[s.ticker];
      const m = calcStockMetrics(s, live, settings.exchangeRates);
      costTotal += m.costBasisUSD;
      valueTotal += m.currentValueUSD;
    });
    return { costTotal, valueTotal, pnl: valueTotal - costTotal, pnlPct: costTotal > 0 ? ((valueTotal - costTotal) / costTotal) * 100 : 0 };
  }, [stocks, prices, settings.exchangeRates]);

  return (
    <div className="page-enter p-4 md:p-6 space-y-5">
      {/* Summary bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Cost Basis', value: fmtCurrency(totals.costTotal, 'USD', true) },
          { label: 'Current Value', value: fmtCurrency(totals.valueTotal, 'USD', true) },
          { label: 'Unrealized P&L', value: fmtPct(totals.pnlPct), color: pnlColor(totals.pnlPct) },
          { label: 'Positions', value: `${stocks.length}` },
        ].map((item) => (
          <div key={item.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
            <p className="text-slate-400 text-xs uppercase tracking-wider">{item.label}</p>
            <p className={`font-bold text-xl mt-1 num ${item.color || 'text-white'}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticker or name…"
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filterExchange}
          onChange={(e) => setFilterExchange(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="All">All Exchanges</option>
          {EXCHANGES.map((ex) => <option key={ex}>{ex}</option>)}
        </select>
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm hover:border-slate-600"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Alert: {settings.alertThreshold}%
        </button>
        <button
          onClick={refreshAll}
          className="flex items-center gap-2 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm hover:bg-slate-600"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Prices
        </button>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Stock
        </button>
      </div>

      {/* Stock Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No stocks yet"
          description="Add your first stock position to start tracking your portfolio performance."
          action={
            <button onClick={openAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Stock
            </button>
          }
        />
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Stock</th>
                  <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Exchange</th>
                  <th className="text-right px-4 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Qty</th>
                  <th className="text-right px-4 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Cost/sh</th>
                  <th className="text-right px-4 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Current</th>
                  <th className="text-right px-4 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Cost Basis</th>
                  <th className="text-right px-4 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Mkt Value</th>
                  <th className="text-right px-4 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">P&L</th>
                  <th className="text-right px-4 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">P&L %</th>
                  <th className="text-right px-4 py-3 text-slate-400 text-xs font-medium uppercase tracking-wider">Day</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map((stock) => {
                  const live = prices?.[stock.ticker];
                  const loading = state.pricesLoading?.[stock.ticker];
                  const m = calcStockMetrics(stock, live, settings.exchangeRates);
                  const isAlert = m.unrealizedPnLPct >= (stock.alertThreshold || settings.alertThreshold);

                  return (
                    <tr key={stock.id} className="tr-hover">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isAlert && (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 pulse-alert shrink-0" />
                          )}
                          <div>
                            <p className="text-white font-semibold text-sm">{stock.name || stock.ticker}</p>
                            <p className="text-slate-500 text-xs">{stock.ticker}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          label={stock.exchange}
                          color={stock.exchange === 'US' ? 'blue' : stock.exchange === 'QSE' ? 'purple' : 'amber'}
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300 text-sm num">{stock.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-400 text-sm num">
                        {stock.currency !== 'USD' ? stock.currency + ' ' : '$'}{stock.purchasePrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm num">
                        {loading ? (
                          <span className="text-slate-500 text-xs">Loading…</span>
                        ) : live?.price ? (
                          <span className="text-white font-medium">
                            {stock.currency !== 'USD' ? stock.currency + ' ' : '$'}{live.price.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 text-sm num">
                        {fmtCurrency(m.costBasisUSD, 'USD', true)}
                      </td>
                      <td className="px-4 py-3 text-right text-white text-sm font-medium num">
                        {fmtCurrency(m.currentValueUSD, 'USD', true)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm num">
                        <span className={pnlColor(m.unrealizedPnL)}>
                          {m.unrealizedPnL >= 0 ? '+' : ''}{fmtCurrency(m.unrealizedPnL, 'USD', true)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${pnlBg(m.unrealizedPnLPct)}`}>
                          {fmtPct(m.unrealizedPnLPct)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm num">
                        <span className={pnlColor(m.dayChangePct)}>
                          {m.dayChangePct !== 0 ? fmtPct(m.dayChangePct) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => refreshTicker(stock.ticker)}
                            className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700"
                            title="Refresh price"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEdit(stock)}
                            className="p-1.5 rounded text-slate-500 hover:text-blue-400 hover:bg-slate-700"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(stock.id)}
                            className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Stock Position' : 'Add Stock Position'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Ticker Symbol *</label>
              <input
                value={form.ticker}
                onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
                placeholder="e.g. AAPL, QNBK, 2222"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Exchange *</label>
              <select
                value={form.exchange}
                onChange={(e) => {
                  const ex = e.target.value;
                  setForm({ ...form, exchange: ex, currency: ex === 'QSE' ? 'QAR' : ex === 'Tadawul' ? 'SAR' : 'USD' });
                }}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                {EXCHANGES.map((ex) => <option key={ex}>{ex}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Company Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Apple Inc."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Purchase Date *</label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Purchase Price ({form.currency}) *</label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={form.purchasePrice}
                onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Quantity (Shares) *</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1.5">
              Profit Alert Threshold: <span className="text-amber-400 font-bold">{form.alertThreshold}%</span>
            </label>
            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={form.alertThreshold}
              onChange={(e) => setForm({ ...form, alertThreshold: parseInt(e.target.value) })}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-slate-600 text-xs mt-1">
              <span>5%</span><span>200%</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-sm">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium">
              {editing ? 'Update' : 'Add Stock'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Alert Settings Modal */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Alert Engine Settings" size="sm">
        <div className="space-y-5">
          <p className="text-slate-400 text-sm">
            Set the global profit threshold. Stocks exceeding this gain will be flagged with a visual alert.
          </p>
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Alert at: <span className="text-amber-400 font-bold">{alertThreshold}%</span> profit
            </label>
            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-slate-600 text-xs mt-1">
              <span>5%</span><span>100%</span><span>200%</span>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-amber-400 text-xs">
              Any stock with an unrealized gain ≥ {alertThreshold}% will trigger an alert indicator and appear in the notification bell.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setSettingsOpen(false)} className="flex-1 px-4 py-2 bg-slate-700 rounded-lg text-slate-300 text-sm">
              Cancel
            </button>
            <button onClick={saveAlertThreshold} className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-white text-sm font-medium">
              Save Threshold
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
