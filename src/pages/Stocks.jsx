import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, TrendingUp, AlertTriangle, Search, SlidersHorizontal } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { useStockPrices } from '../hooks/useStockPrices';
import { calcStockMetrics, fmtCurrency, fmtPct, pnlBg, pnlColor } from '../utils/calculations';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import OwnershipEditor from '../components/common/OwnershipEditor';
import toast from 'react-hot-toast';

const EXCHANGES = ['US', 'QSE', 'Tadawul'];
const CURRENCIES = ['USD', 'QAR', 'SAR', 'GBP', 'EUR'];

function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

const defaultForm = {
  ticker: '', exchange: 'US', name: '', purchaseDate: '',
  purchasePrice: '', quantity: '', currency: 'USD', alertThreshold: 30,
  owners: [],
};

/* Small avatar row showing asset owners */
function OwnerRow({ owners = [], members = [] }) {
  if (!owners?.length) return <span className="text-slate-600 text-xs">—</span>;
  return (
    <div className="flex items-center gap-1">
      {owners.map((o) => {
        const m = members.find((mem) => mem.id === o.memberId);
        if (!m) return null;
        return (
          <div
            key={o.memberId}
            title={`${m.name}: ${o.ownershipPct}%`}
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
            style={{ background: m.color || '#d4a017', boxShadow: `0 0 6px ${m.color || '#d4a017'}44` }}
          >
            {m.avatar || m.name[0]}
          </div>
        );
      })}
    </div>
  );
}

export default function Stocks() {
  const { state, dispatch } = usePortfolio();
  const { refreshTicker, refreshAll } = useStockPrices();
  const { stocks, prices, settings, members } = state;

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [search, setSearch] = useState('');
  const [filterExchange, setFilterExchange] = useState('All');
  const [alertThreshold, setAlertThreshold] = useState(settings.alertThreshold);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const openAdd = () => { setEditing(null); setForm(defaultForm); setModal(true); };
  const openEdit = (stock) => { setEditing(stock.id); setForm({ owners: [], ...stock }); setModal(true); };

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
    if (stock.exchange === 'QSE' && !stock.ticker.endsWith('.QA')) {
      stock.ticker = `${stock.ticker.toUpperCase()}.QA`;
    } else if (stock.exchange === 'Tadawul' && !stock.ticker.endsWith('.SR')) {
      stock.ticker = `${stock.ticker.toUpperCase()}.SR`;
    } else {
      stock.ticker = stock.ticker.toUpperCase();
    }
    /* Validate ownership totals */
    if (stock.owners?.length) {
      const total = stock.owners.reduce((s, o) => s + (parseFloat(o.ownershipPct) || 0), 0);
      if (Math.abs(total - 100) > 0.1) {
        toast.error('Ownership percentages must sum to 100%');
        return;
      }
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
          { label: 'Total Cost Basis',  value: fmtCurrency(totals.costTotal,  'USD', true),  color: 'text-white' },
          { label: 'Current Value',     value: fmtCurrency(totals.valueTotal, 'USD', true),  color: 'text-white' },
          { label: 'Unrealized P&L',    value: fmtPct(totals.pnlPct),                        color: pnlColor(totals.pnlPct) },
          { label: 'Positions',         value: `${stocks.length}`,                           color: 'text-white' },
        ].map((item) => (
          <div key={item.label} className="card p-4">
            <p className="section-label mb-1.5">{item.label}</p>
            <p className={`font-bold text-xl num ${item.color}`}>{item.value}</p>
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
            className="w-full pl-9 pr-4 py-2 rounded-lg text-white text-sm"
          />
        </div>
        <select
          value={filterExchange}
          onChange={(e) => setFilterExchange(e.target.value)}
          className="px-3 py-2 rounded-lg text-slate-300 text-sm"
        >
          <option value="All">All Exchanges</option>
          {EXCHANGES.map((ex) => <option key={ex}>{ex}</option>)}
        </select>
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{
            color: '#d4a017',
            background: 'rgba(212,160,23,0.08)',
            border: '1px solid rgba(212,160,23,0.2)',
          }}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Alert: {settings.alertThreshold}%
        </button>
        <button
          onClick={refreshAll}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 text-sm hover:text-white transition-colors"
          style={{ background: 'rgba(11,21,40,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold btn-gold"
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
            <button onClick={openAdd} className="px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2 btn-gold">
              <Plus className="w-4 h-4" /> Add Stock
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th className="text-left px-4 py-3 section-label">Stock</th>
                  <th className="text-left px-4 py-3 section-label">Exchange</th>
                  <th className="text-right px-4 py-3 section-label">Qty</th>
                  <th className="text-right px-4 py-3 section-label">Cost/sh</th>
                  <th className="text-right px-4 py-3 section-label">Current</th>
                  <th className="text-right px-4 py-3 section-label">Cost Basis</th>
                  <th className="text-right px-4 py-3 section-label">Mkt Value</th>
                  <th className="text-right px-4 py-3 section-label">P&L</th>
                  <th className="text-right px-4 py-3 section-label">P&L %</th>
                  <th className="text-right px-4 py-3 section-label hidden xl:table-cell">Day</th>
                  <th className="text-left px-4 py-3 section-label hidden lg:table-cell">Owners</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((stock) => {
                  const live = prices?.[stock.ticker];
                  const loading = state.pricesLoading?.[stock.ticker];
                  const m = calcStockMetrics(stock, live, settings.exchangeRates);
                  const isAlert = m.unrealizedPnLPct >= (stock.alertThreshold || settings.alertThreshold);

                  return (
                    <tr key={stock.id} className="tr-hover" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isAlert && <AlertTriangle className="w-3.5 h-3.5 pulse-alert shrink-0" style={{ color: '#d4a017' }} />}
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
                        {loading
                          ? <span className="text-slate-500 text-xs">Loading…</span>
                          : live?.price
                            ? <span className="text-white font-medium">{stock.currency !== 'USD' ? stock.currency + ' ' : '$'}{live.price.toFixed(2)}</span>
                            : <span className="text-slate-500 text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 text-sm num">{fmtCurrency(m.costBasisUSD,   'USD', true)}</td>
                      <td className="px-4 py-3 text-right text-white text-sm font-medium num">{fmtCurrency(m.currentValueUSD, 'USD', true)}</td>
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
                      <td className="px-4 py-3 text-right text-sm num hidden xl:table-cell">
                        <span className={pnlColor(m.dayChangePct)}>
                          {m.dayChangePct !== 0 ? fmtPct(m.dayChangePct) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <OwnerRow owners={stock.owners} members={members} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => refreshTicker(stock.ticker)} className="p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700" title="Refresh price">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openEdit(stock)} className="p-1.5 rounded text-slate-500 hover:text-blue-400 hover:bg-slate-700">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(stock.id)} className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700">
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
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Stock Position' : 'Add Stock Position'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Ticker Symbol *</label>
              <input
                value={form.ticker}
                onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })}
                placeholder="e.g. AAPL, QNBK"
                className="w-full px-3 py-2 rounded-lg text-white text-sm"
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
                className="w-full px-3 py-2 rounded-lg text-white text-sm"
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
              className="w-full px-3 py-2 rounded-lg text-white text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Purchase Date *</label>
              <input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className="w-full px-3 py-2 rounded-lg text-white text-sm" required />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Currency</label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full px-3 py-2 rounded-lg text-white text-sm">
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Purchase Price ({form.currency}) *</label>
              <input type="number" step="0.0001" min="0" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} placeholder="0.00" className="w-full px-3 py-2 rounded-lg text-white text-sm" required />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Quantity *</label>
              <input type="number" step="0.001" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" className="w-full px-3 py-2 rounded-lg text-white text-sm" required />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1.5">
              Profit Alert: <span className="font-bold" style={{ color: '#d4a017' }}>{form.alertThreshold}%</span>
            </label>
            <input type="range" min="5" max="200" step="5" value={form.alertThreshold} onChange={(e) => setForm({ ...form, alertThreshold: parseInt(e.target.value) })} className="w-full" style={{ accentColor: '#d4a017' }} />
          </div>

          {/* Ownership */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: 'rgba(212,160,23,0.04)', border: '1px solid rgba(212,160,23,0.12)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#d4a017' }} />
              <p className="text-white text-sm font-medium">Family Ownership</p>
              <span className="text-slate-500 text-xs">(optional)</span>
            </div>
            <OwnershipEditor owners={form.owners || []} onChange={(owners) => setForm({ ...form, owners })} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="flex-1 px-4 py-2 rounded-lg text-slate-300 text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 rounded-lg text-white text-sm font-semibold btn-gold">
              {editing ? 'Update Stock' : 'Add Stock'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Alert Settings Modal */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Alert Engine Settings" size="sm">
        <div className="space-y-5">
          <p className="text-slate-400 text-sm">Set the profit threshold at which stocks trigger visual alerts.</p>
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Alert at: <span className="font-bold" style={{ color: '#d4a017' }}>{alertThreshold}%</span> gain
            </label>
            <input type="range" min="5" max="200" step="5" value={alertThreshold} onChange={(e) => setAlertThreshold(parseInt(e.target.value))} className="w-full" style={{ accentColor: '#d4a017' }} />
          </div>
          <div className="rounded-lg p-3" style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)' }}>
            <p className="text-xs" style={{ color: '#d4a017' }}>
              Stocks with unrealized gains ≥ {alertThreshold}% will be flagged with an alert indicator.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setSettingsOpen(false)} className="flex-1 px-4 py-2 rounded-lg text-slate-300 text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>Cancel</button>
            <button onClick={saveAlertThreshold} className="flex-1 px-4 py-2 rounded-lg text-white text-sm font-semibold btn-gold">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
