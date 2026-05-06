import { useState } from 'react';
import { Plus, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';

export default function OwnershipEditor({ owners = [], onChange }) {
  const { state } = usePortfolio();
  const { members } = state;
  const [addingMemberId, setAddingMemberId] = useState('');

  const totalPct = owners.reduce((s, o) => s + (parseFloat(o.ownershipPct) || 0), 0);
  const isValid = owners.length === 0 || Math.abs(totalPct - 100) < 0.01;
  const availableMembers = members.filter((m) => !owners.find((o) => o.memberId === m.id));

  const addOwner = () => {
    if (!addingMemberId) return;
    const remaining = Math.max(0, parseFloat((100 - totalPct).toFixed(1)));
    onChange([...owners, { memberId: addingMemberId, ownershipPct: remaining }]);
    setAddingMemberId('');
  };

  const removeOwner = (memberId) => onChange(owners.filter((o) => o.memberId !== memberId));

  const updatePct = (memberId, val) =>
    onChange(owners.map((o) => (o.memberId === memberId ? { ...o, ownershipPct: parseFloat(val) || 0 } : o)));

  const splitEvenly = () => {
    if (owners.length === 0) return;
    const pct = parseFloat((100 / owners.length).toFixed(2));
    onChange(owners.map((o, i) => ({
      ...o,
      ownershipPct: i === owners.length - 1 ? parseFloat((100 - pct * (owners.length - 1)).toFixed(2)) : pct,
    })));
  };

  const getMember = (id) => members.find((m) => m.id === id);

  if (members.length === 0) {
    return (
      <p className="text-slate-500 text-xs italic py-2">
        Add family members on the Family page first to enable per-asset ownership tracking.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {owners.length === 0 && (
        <p className="text-slate-500 text-xs italic">
          No owners assigned — asset counts as family pool. Add owners to track individual stakes.
        </p>
      )}

      {owners.map((owner) => {
        const member = getMember(owner.memberId);
        if (!member) return null;
        return (
          <div key={owner.memberId} className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
              style={{ background: `linear-gradient(135deg, ${member.color || '#6366f1'}, ${member.color || '#6366f1'}99)` }}
            >
              {member.avatar || member.name[0]}
            </div>
            <span className="text-slate-200 text-sm flex-1 truncate">{member.name}</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={owner.ownershipPct}
              onChange={(e) => updatePct(owner.memberId, e.target.value)}
              className="w-20 px-2 py-1.5 rounded-lg text-white text-sm text-right font-semibold num"
            />
            <span className="text-slate-500 text-xs w-3">%</span>
            <button
              type="button"
              onClick={() => removeOwner(owner.memberId)}
              className="p-1 rounded text-slate-600 hover:text-rose-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}

      {/* Total row */}
      {owners.length > 0 && (
        <div
          className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs"
          style={{
            background: isValid ? 'rgba(52,211,153,0.06)' : 'rgba(251,113,133,0.06)',
            border: `1px solid ${isValid ? 'rgba(52,211,153,0.15)' : 'rgba(251,113,133,0.15)'}`,
          }}
        >
          <div className="flex items-center gap-1.5">
            {isValid
              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              : <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
            <span className={isValid ? 'text-emerald-400' : 'text-rose-400'}>
              {isValid ? 'Ownership verified' : `Total must equal 100% (currently ${totalPct.toFixed(1)}%)`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={splitEvenly}
              className="text-slate-400 hover:text-white underline transition-colors"
            >
              Split evenly
            </button>
            <span
              className="font-bold num"
              style={{ color: isValid ? '#34d399' : '#fb7185' }}
            >
              {totalPct.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Add member row */}
      {availableMembers.length > 0 && (
        <div className="flex gap-2 pt-1">
          <select
            value={addingMemberId}
            onChange={(e) => setAddingMemberId(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg text-sm"
          >
            <option value="">Add an owner…</option>
            {availableMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={addOwner}
            disabled={!addingMemberId}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(212,160,23,0.12)',
              border: '1px solid rgba(212,160,23,0.25)',
              color: '#d4a017',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      )}
    </div>
  );
}
