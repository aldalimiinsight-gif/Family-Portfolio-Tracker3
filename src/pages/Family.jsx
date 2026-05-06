import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Users, PlusCircle } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import {
  calcMemberContributions, calcMemberNetWorth, calcTotalPortfolioValue,
  fmtCurrency, fmtPct, buildGrowthHistory,
} from '../utils/calculations';
import Modal from '../components/common/Modal';
import FamilyOwnershipChart from '../components/charts/FamilyOwnershipChart';
import GrowthChart from '../components/charts/GrowthChart';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];

function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

const defaultMember = { name: '', color: '#3b82f6', avatar: '' };
const defaultContrib = { memberId: '', amount: '', date: '', currency: 'USD' };

export default function Family() {
  const { state, dispatch } = usePortfolio();
  const { members, contributions, prices, settings } = state;

  const [memberModal, setMemberModal] = useState(false);
  const [contribModal, setContribModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editingContrib, setEditingContrib] = useState(null);
  const [memberForm, setMemberForm] = useState(defaultMember);
  const [contribForm, setContribForm] = useState(defaultContrib);

  const totals = useMemo(() => calcTotalPortfolioValue(state, prices), [state, prices]);

  const memberData = useMemo(() =>
    calcMemberContributions(contributions, members, settings.exchangeRates).map((m) => ({
      ...m,
      netWorth: calcMemberNetWorth(m, totals.total),
    })),
    [contributions, members, settings.exchangeRates, totals.total]
  );

  const growthHistory = useMemo(() => buildGrowthHistory(contributions), [contributions]);

  // Member CRUD
  const openAddMember = () => {
    setEditingMember(null);
    setMemberForm({ ...defaultMember, color: COLORS[members.length % COLORS.length] });
    setMemberModal(true);
  };
  const openEditMember = (m) => { setEditingMember(m.id); setMemberForm({ ...m }); setMemberModal(true); };

  const saveMember = (e) => {
    e.preventDefault();
    if (!memberForm.name.trim()) { toast.error('Name is required'); return; }
    const avatar = memberForm.avatar || memberForm.name[0]?.toUpperCase() || '?';
    if (editingMember) {
      dispatch({ type: 'UPDATE_MEMBER', payload: { ...memberForm, avatar, id: editingMember } });
      toast.success('Member updated');
    } else {
      dispatch({ type: 'ADD_MEMBER', payload: { ...memberForm, avatar, id: genId() } });
      toast.success('Member added');
    }
    setMemberModal(false);
  };

  const deleteMember = (id) => {
    if (confirm('Remove member and all their contributions?')) {
      dispatch({ type: 'DELETE_MEMBER', payload: id });
      toast.success('Member removed');
    }
  };

  // Contribution CRUD
  const openAddContrib = (memberId = '') => {
    setEditingContrib(null);
    setContribForm({ ...defaultContrib, memberId, date: new Date().toISOString().slice(0, 7) });
    setContribModal(true);
  };
  const openEditContrib = (c) => { setEditingContrib(c.id); setContribForm({ ...c }); setContribModal(true); };

  const saveContrib = (e) => {
    e.preventDefault();
    const contrib = { ...contribForm, amount: parseFloat(contribForm.amount) };
    if (!contrib.memberId || !contrib.amount || !contrib.date) {
      toast.error('All fields required');
      return;
    }
    if (editingContrib) {
      dispatch({ type: 'UPDATE_CONTRIBUTION', payload: { ...contrib, id: editingContrib } });
      toast.success('Contribution updated');
    } else {
      dispatch({ type: 'ADD_CONTRIBUTION', payload: { ...contrib, id: genId() } });
      toast.success('Contribution added');
    }
    setContribModal(false);
  };

  const deleteContrib = (id) => {
    if (confirm('Delete this contribution?')) {
      dispatch({ type: 'DELETE_CONTRIBUTION', payload: id });
      toast.success('Contribution removed');
    }
  };

  // Group contributions by member
  const contribByMember = useMemo(() => {
    const map = {};
    members.forEach((m) => { map[m.id] = []; });
    contributions.forEach((c) => {
      if (map[c.memberId]) map[c.memberId].push(c);
    });
    return map;
  }, [members, contributions]);

  return (
    <div className="page-enter p-4 md:p-6 space-y-6">
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-white font-semibold text-sm mb-3">Ownership Distribution</h3>
          <FamilyOwnershipChart data={memberData} />
        </div>
        <div className="card p-5">
          <h3 className="text-white font-semibold text-sm mb-3">Cumulative Contributions</h3>
          <GrowthChart data={growthHistory} />
        </div>
      </div>

      {/* Members section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Family Members</h2>
          <button
            onClick={openAddMember}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 0 20px rgba(59,130,246,0.25)' }}
          >
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>

        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No family members yet"
            description="Add family members to begin tracking individual ownership and contributions."
            action={
              <button onClick={openAddMember} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add First Member
              </button>
            }
          />
        ) : (
          <div className="space-y-4">
            {memberData.map((m) => (
              <div key={m.id} className="card overflow-hidden">
                {/* Member header */}
                <div className="flex items-center gap-4 p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: m.color || '#3b82f6' }}
                  >
                    {m.avatar || m.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold text-base">{m.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="text-slate-400">
                        Ownership: <span className="text-white font-bold">{fmtPct(m.ownershipPct, 1)}</span>
                      </span>
                      <span className="text-slate-400">
                        Invested: <span className="text-white font-bold num">{fmtCurrency(m.totalContribution, 'USD', true)}</span>
                      </span>
                      <span className="text-slate-400">
                        Net Worth: <span className="text-emerald-400 font-bold num">{fmtCurrency(m.netWorth, 'USD', true)}</span>
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(m.ownershipPct, 100)}%`,
                          background: `linear-gradient(90deg, ${m.color || '#6366f1'}, ${m.color || '#6366f1'}88)`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openAddContrib(m.id)} className="p-2 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-slate-700" title="Add contribution">
                      <PlusCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEditMember(m)} className="p-2 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-slate-700">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteMember(m.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contributions list */}
                {(contribByMember[m.id] || []).length > 0 && (
                  <div className="px-5 py-3">
                    <p className="section-label mb-2">Contributions ({contribByMember[m.id].length})</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {[...contribByMember[m.id]].sort((a, b) => a.date > b.date ? -1 : 1).map((c) => (
                        <div key={c.id} className="rounded-lg p-2.5 group relative" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p className="text-slate-400 text-xs">{c.date}</p>
                          <p className="text-white font-semibold text-sm num">{fmtCurrency(c.amount, c.currency || 'USD', true)}</p>
                          <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                            <button onClick={() => openEditContrib(c)} className="p-0.5 rounded text-slate-500 hover:text-blue-400">
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button onClick={() => deleteContrib(c.id)} className="p-0.5 rounded text-slate-500 hover:text-red-400">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Member Modal */}
      <Modal open={memberModal} onClose={() => setMemberModal(false)} title={editingMember ? 'Edit Member' : 'Add Family Member'} size="sm">
        <form onSubmit={saveMember} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Full Name *</label>
            <input
              value={memberForm.name}
              onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
              placeholder="e.g. Ahmed Al Rashid"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Avatar Initial (optional)</label>
            <input
              value={memberForm.avatar}
              onChange={(e) => setMemberForm({ ...memberForm, avatar: e.target.value.slice(0, 2).toUpperCase() })}
              placeholder="e.g. A"
              maxLength={2}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setMemberForm({ ...memberForm, color: c })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${memberForm.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setMemberModal(false)} className="flex-1 px-4 py-2 bg-slate-700 rounded-lg text-slate-300 text-sm">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium">
              {editingMember ? 'Update' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Contribution Modal */}
      <Modal open={contribModal} onClose={() => setContribModal(false)} title={editingContrib ? 'Edit Contribution' : 'Add Contribution'} size="sm">
        <form onSubmit={saveContrib} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Member *</label>
            <select
              value={contribForm.memberId}
              onChange={(e) => setContribForm({ ...contribForm, memberId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Select member…</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Amount *</label>
              <input
                type="number" min="0" step="0.01"
                value={contribForm.amount}
                onChange={(e) => setContribForm({ ...contribForm, amount: e.target.value })}
                placeholder="10000"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">Currency</label>
              <select
                value={contribForm.currency}
                onChange={(e) => setContribForm({ ...contribForm, currency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                {['USD', 'QAR', 'SAR', 'AED', 'GBP', 'EUR'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1.5">Month (YYYY-MM) *</label>
            <input
              type="month"
              value={contribForm.date}
              onChange={(e) => setContribForm({ ...contribForm, date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setContribModal(false)} className="flex-1 px-4 py-2 bg-slate-700 rounded-lg text-slate-300 text-sm">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium">
              {editingContrib ? 'Update' : 'Add Contribution'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
