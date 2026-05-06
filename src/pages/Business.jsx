import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Briefcase } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { calcBusinessPnL, fmtCurrency, fmtPct, pnlColor, pnlBg } from '../utils/calculations';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import OwnershipEditor from '../components/common/OwnershipEditor';
import toast from 'react-hot-toast';

const CURRENCIES = ['USD', 'QAR', 'SAR', 'AED', 'GBP', 'EUR'];
const SECTORS = [
  'Technology', 'Real Estate', 'Finance', 'Food & Beverage', 'Healthcare',
  'Retail', 'Energy', 'Manufacturing', 'Media', 'Transport', 'Education', 'Other',
];

function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

const defaultForm = {
  businessName: '', sector: 'Technology', capitalInvested: '', ownershipPercent: '',
  currency: 'USD', investmentDate: '', currentValuation: '', description: '', owners: [],
};

/* Owner badges on card */
function OwnerBadges({ owners = [], members = [] }) {
  if (!owners?.length) return null;
  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-2">
      {owners.map((o) => {
        const m = members.find((mem) => mem.id === o.memberId);
        if (!m) return null;
        return (
          <span
            key={o.memberId}
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{
              background: `${m.color || '#d4a017'}15`,
              color: m.color || '#d4a017',
              border: `1px solid ${m.color || '#d4a017'}30`,
            }}
          >
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
              style={{ background: m.color || '#d4a017' }}
            >
              {m.avatar || m.name[0]}
            </span>
            {m.name} {o.ownershipPct}%
          </span>
        );
      })}
    </div>
  );
}

export default function Business() {
  const { state, dispatch } = usePortfolio();
  const { business, members } = state;

  const [modal, setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]     = useState(defaultForm);

  const openAdd  = () => { setEditing(null); setForm(defaultForm); setModal(true); };
  const openEdit = (b) => { setEditing(b.id); setForm({ owners: [], ...b }); setModal(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const biz = {
      ...form,
      capitalInvested:  parseFloat(form.capitalInvested)  || 0,
      ownershipPercent: parseFloat(form.ownershipPercent) || 0,
      currentValuation: parseFloat(form.currentValuation) || 0,
    };
    if (!biz.businessName || !biz.capitalInvested) {
      toast.error('Business name and capital invested are required');
      return;
    }
    if (biz.owners?.length) {
      const total = biz.owners.reduce((s, o) => s + (parseFloat(o.ownershipPct) || 0), 0);
      if (Math.abs(total - 100) > 0.1) {
        toast.error('Ownership percentages must sum to 100%');
        return;
      }
    }
    if (editing) {
      dispatch({ type: 'UPDATE_BUSINESS', payload: { ...biz, id: editing } });
      toast.success('Business updated');
    } else {
      dispatch({ type: 'ADD_BUSINESS', payload: { ...biz, id: genId() } });
      toast.success('Business added');
    }
    setModal(false);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this business investment?')) {
      dispatch({ type: 'DELETE_BUSINESS', payload: id });
      toast.success('Business removed');
    }
  };

  const totals = useMemo(() => {
    let capital = 0, currentValue = 0;
    business.forEach((b) => {
      capital      += b.capitalInvested || 0;
      currentValue += calcBusinessPnL(b).currentValue;
    });
    return {
      capital, currentValue,
      pnl:    currentValue - capital,
      pnlPct: capital > 0 ? ((currentValue - capital) / capital) * 100 : 0,
    };
  }, [business]);

  return (
    <div className="page-enter p-4 md:p-6 space-y-5">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Capital Deployed', value: fmtCurrency(totals.capital,       'USD', true), color: 'text-white' },
          { label: 'Current Value',    value: fmtCurrency(totals.currentValue,  'USD', true), color: 'text-white' },
          { label: 'Unrealized P&L',   value: fmtCurrency(totals.pnl,          'USD', true), color: pnlColor(totals.pnl) },
          { label: 'Total Return',     value: fmtPct(totals.pnlPct, 1),                       color: pnlColor(totals.pnlPct) },
        ].map((item) => (
          <div key={item.label} className="card p-4">
            <p className="section-label mb-1.5">{item.label}</p>
            <p className={`font-bold text-xl num ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold">Private Business Investments</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold btn-gold"
        >
          <Plus className="w-4 h-4" />
          Add Business
        </button>
      </div>

      {/* Grid of business cards */}
      {business.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No business investments"
          description="Track your private equity and venture investments here."
          action={
            <button onClick={openAdd} className="px-4 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2 btn-gold">
              <Plus className="w-4 h-4" /> Add Business
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {business.map((b) => {
            const { pnl, pct, currentValue } = calcBusinessPnL(b);
            const impliedValue = b.currentValuation || 0;
            return (
              <div key={b.id} className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-white font-semibold">{b.businessName}</h3>
                      <Badge label={b.sector} color="green" />
                    </div>
                    {b.investmentDate && <p className="text-slate-500 text-xs">Since {b.investmentDate}</p>}
                    {b.description && <p className="text-slate-400 text-xs mt-1 line-clamp-2">{b.description}</p>}
                    {b.owners?.length > 0 && <OwnerBadges owners={b.owners} members={members} />}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(b)} className="p-1.5 rounded text-slate-500 hover:text-blue-400 hover:bg-slate-700">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-slate-400 text-xs">Capital Invested</p>
                    <p className="text-white font-bold num">{fmtCurrency(b.capitalInvested, b.currency, true)}</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-slate-400 text-xs">Ownership Stake</p>
                    <p className="font-bold" style={{ color: '#d4a017' }}>{b.ownershipPercent}%</p>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-slate-400 text-xs">Current Value (share)</p>
                    <p className="text-white font-bold num">{fmtCurrency(currentValue, b.currency, true)}</p>
                    {impliedValue > 0 && (
                      <p className="text-slate-500 text-xs">Valuation: {fmtCurrency(impliedValue, b.currency, true)}</p>
                    )}
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p className="text-slate-400 text-xs">Unrealized Return</p>
                    <p className={`font-bold num ${pnlColor(pnl)}`}>{fmtCurrency(pnl, b.currency, true)}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${pnlBg(pct)}`}>
                      {fmtPct(pct)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Business' : 'Add Business Investment'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Business Name *</label>
            <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="e.g. Gulf Tech Ventures LLC" className="w-full px-3 py-2 rounded-lg text-white text-sm" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Sector</label>
              <select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="w-full px-3 py-2 rounded-lg text-white text-sm">
                {SECTORS.map((s) => <option key={s}>{s}</option>)}
              </select>
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
              <label className="block text-slate-400 text-xs mb-1.5">Capital Invested ({form.currency}) *</label>
              <input type="number" min="0" step="0.01" value={form.capitalInvested} onChange={(e) => setForm({ ...form, capitalInvested: e.target.value })} placeholder="50000" className="w-full px-3 py-2 rounded-lg text-white text-sm" required />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Family Ownership % *</label>
              <input type="number" min="0" max="100" step="0.01" value={form.ownershipPercent} onChange={(e) => setForm({ ...form, ownershipPercent: e.target.value })} placeholder="15" required className="w-full px-3 py-2 rounded-lg text-white text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Investment Date</label>
              <input type="date" value={form.investmentDate} onChange={(e) => setForm({ ...form, investmentDate: e.target.value })} className="w-full px-3 py-2 rounded-lg text-white text-sm" />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Current Valuation ({form.currency})</label>
              <input type="number" min="0" step="0.01" value={form.currentValuation} onChange={(e) => setForm({ ...form, currentValuation: e.target.value })} placeholder="Company total value" className="w-full px-3 py-2 rounded-lg text-white text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Brief description of the business…" className="w-full px-3 py-2 rounded-lg text-white text-sm resize-none" />
          </div>

          {/* Ownership */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(212,160,23,0.04)', border: '1px solid rgba(212,160,23,0.12)' }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#d4a017' }} />
              <p className="text-white text-sm font-medium">Family Ownership</p>
              <span className="text-slate-500 text-xs">(optional)</span>
            </div>
            <OwnershipEditor owners={form.owners || []} onChange={(owners) => setForm({ ...form, owners })} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="flex-1 px-4 py-2 rounded-lg text-slate-300 text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 rounded-lg text-white text-sm font-semibold btn-gold">
              {editing ? 'Update' : 'Add Business'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
