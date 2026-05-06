import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Building2, Briefcase, Users,
  Upload, FileText, BarChart3, X, Sparkles,
} from 'lucide-react';

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard',      color: 'text-indigo-400' },
  { to: '/stocks',     icon: TrendingUp,      label: 'Stocks',         color: 'text-blue-400' },
  { to: '/analysis',   icon: BarChart3,       label: 'Stock Analysis', color: 'text-cyan-400' },
  { to: '/realestate', icon: Building2,       label: 'Real Estate',    color: 'text-violet-400' },
  { to: '/business',   icon: Briefcase,       label: 'Business',       color: 'text-emerald-400' },
  { to: '/family',     icon: Users,           label: 'Family Equity',  color: 'text-amber-400' },
  { to: '/upload',     icon: Upload,          label: 'Upload Data',    color: 'text-slate-400' },
  { to: '/reports',    icon: FileText,        label: 'Reports',        color: 'text-rose-400' },
];

const GROUPS = [
  { label: 'Portfolio', items: NAV.slice(0, 1) },
  { label: 'Assets',    items: NAV.slice(1, 5) },
  { label: 'Management', items: NAV.slice(5) },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-30 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        style={{ background: 'linear-gradient(180deg, #04070f 0%, #060c1c 100%)' }}
        className={[
          'fixed top-0 left-0 h-full z-40 w-64 flex flex-col',
          'border-r border-white/[0.05]',
          'transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:relative lg:z-auto',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-white/[0.05] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Family Office</p>
                <p className="text-slate-500 text-xs leading-tight mt-0.5">Portfolio Tracker</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-1 text-slate-500 hover:text-white rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="section-label px-3 mb-2">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(({ to, icon: Icon, label, color }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                        isActive
                          ? 'text-white'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]',
                      ].join(' ')
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <>
                            {/* Active bg */}
                            <div
                              className="absolute inset-0 rounded-xl"
                              style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))' }}
                            />
                            {/* Left accent bar */}
                            <div
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                              style={{ background: 'linear-gradient(180deg, #818cf8, #6366f1)' }}
                            />
                          </>
                        )}
                        <div className={`relative z-10 flex items-center gap-3 w-full`}>
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : color + ' group-hover:' + color}`} />
                          <span className="flex-1">{label}</span>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-80" />
                          )}
                        </div>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/[0.05] shrink-0">
          <div className="flex items-center gap-2.5 px-1">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">All data stored locally</p>
              <p className="text-slate-600 text-xs">v1.2 · Private & Secure</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
