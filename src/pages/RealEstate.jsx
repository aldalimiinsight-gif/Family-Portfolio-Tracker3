import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { fmtCurrency, fmtPct } from '../utils/calculations';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import AllocationChart from '../components/charts/AllocationChart';
import toast from 'react-hot-toast';

const CURRENCIES = ['USD', 'AED', 'GBP', 'EUR', 'QAR', 'SAR'];
const PLATFORMS = ['Stake', 'Equity Multiple', 'Arrived', 'Fundrise', 'Direct', 'Other'];

function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

const defaultForm = {
  propertyName: '', platform: 'Stake', investmentAmount: '', annualizedROI: '',
  currency: 'USD', purchaseDate: '', location: '', notes: '',
};

export default function RealEstate() {
  const { state, dispatch } = usePortfolio();
  const { realEstate } = state;

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const openAdd = () => { setEditing(null); setForm(defaultForm); setModal(true); };
  const openEdit = (p) => { setEditing(p.id); setForm({ ...p }); setModal(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const property = {
      ...form,
      investmentAmount: parseFloat(form.investmentAmount),
      annualizedROI: parseFloat(form.annualizedROI),
    };
    if (!property.propertyName || !property.investmentAmount) {
      toast.error('Property name and investment amount are required');
      return;
    }
    if (editing) {
      dispatch({ type: 'UPDATE_REAL_ESTATE', payload: { ...property, id: editing } });
      toast.success('Property updated');
    } else {
      dispatch({ type: 'ADD_REAL_ESTATE', payload: { ...property, id: genId() } });
      toast.success('Property added');
    }
    setModal(false);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this property?')) {
      dispatch({ type: 'DELETE_REAL_ESTATE', payload: id });
      toast.success('Property removed');
    }
  };

  const totals = useMemo(() => {
    const invested = realEstate.reduce((s, p) => s + (p.investmentAmount || 0), 0);
    const annualIncome = realEstate.reduce((s, p) => s + (p.investmentAmount || 0) * (p.annualizedROI || 0) / 100, 0);
    const avgROI = realEstate.length > 0
      ? realEstate.reduce((s, p) => s + (p.annualizedROI || 0), 0) / realEstate.length
      : 0;
    return { invested, annualIncome, avgROI };
  }, [realEstate]);

  const chartData = useMemo(() =>
    realEstate.map((p) => ({ name: p.propertyName, value: p.investmentAmount || 0, pct: totals.invested > 0 ? ((p.investmentAmount || 0) / totals.invested) * 100 : 0 })),
    [realEstate, totals.invested]
  );

  return (
    <div className="page-enter p-4 md:p-6 space-y-5">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Invested', value: fmtCurrency(totals.invested, 'USD', true), color: 'text-white' },
          { label: 'Properties', value: `${realEstate.length}`, color: 'text-white' },
          { label: 'Annual Income', value: fmtCurrency(totals.annualIncome, 'USD', true), color: 'text-emerald-400' },
          { label: 'Avg. ROI', value: fmtPct(totals.avgROI, 1), color: 'text-blue-400' },
        ].map((item) => (
          <div key={item.label} className="card p-4">
            <p className="section-label mb-1.5">{item.label}</p>
            <p className={`font-bold text-xl num ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        {realEstate.length > 0 && (
          <div className="card p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Portfolio Distribution</h3>
            <AllocationChart data={chartData} />
          </div>
        )}

        {/* Table */}
        <div className={realEstate.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Properties</h2>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 0 20px rgba(139,92,246,0.25)' }}
            >
              <Plus className="w-4 h-4" />
              Add Property
            </button>
          </div>

          {realEstate.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No properties yet"
              description="Add your Stake or other real estate investments to track performance."
              action={
                <button onClick={openAdd} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm font-medium flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Property
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {realEstate.map((p) => {
                const annual = (p.investmentAmount || 0) * (p.annualizedROI || 0) / 100;
                const monthly = annual / 12;
                const alloc = totals.invested > 0 ? ((p.investmentAmount || 0) / totals.invested) * 100 : 0;
                return (
                  <div key={p.id} className="card p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-semibold text-sm">{p.propertyName}</h3>
                          <Badge label={p.platform} color="purple" />
                        </div>
                        {p.location && <p className="text-slate-500 text-xs">{p.location}</p>}
                        {p.purchaseDate && <p className="text-slate-600 text-xs">Since {p.purchaseDate}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded text-slate-500 hover:text-blue-400 hover:bg-slate-700">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-slate-500 text-xs">Invested</p>
                        <p className="text-white font-bold text-base num">{fmtCurrency(p.investmentAmount, p.currency, true)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Annual ROI</p>
                        <p className="text-emerald-400 font-bold text-base num">{fmtPct(p.annualizedROI, 1)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Annual Income</p>
                        <p className="text-white font-semibold text-sm num">{fmtCurrency(annual, p.currency, true)}</p>
                        <p className="text-slate-500 text-xs">{fmtCurrency(monthly, p.currency, true)}/mo</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">Portfolio Share</p>
                        <p className="text-slate-300 font-semibold text-sm num">{fmtPct(alloc, 1)}</p>
                        <div className="h-1.5 rounded-full mt-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(alloc, 100)}%`, background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' }} />
                        </div>
                      </div>
                    </div>
                    {p.notes && <p className="text-slate-500 text-xs mt-3 italic">{p.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Property' : 'Add Property'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Property Name *</label>
            <input
              value={form.propertyName}
              onChange={(e) => setForm({ ...form, propertyName: e.target.value })}
              placeholder="e.g. Marina Heights Tower, Dubai"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Platform</label>
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
              </select>
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
              <label className="block text-slate-400 text-xs mb-1.5">Investment Amount ({form.currency}) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.investmentAmount}
                onChange={(e) => setForm({ ...form, investmentAmount: e.target.value })}
                placeholder="10000"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Annualized ROI (%)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.annualizedROI}
                onChange={(e) => setForm({ ...form, annualizedROI: e.target.value })}
                placeholder="8.5"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Purchase Date</label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Dubai Marina, UAE"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Any additional notes…"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-sm">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm font-medium">
              {editing ? 'Update' : 'Add Property'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
