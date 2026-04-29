import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Building2, Briefcase, Users,
  Upload, FileText, BarChart3, X, ChevronRight,
} from 'lucide-react';

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/stocks',    icon: TrendingUp,      label: 'Stocks' },
  { to: '/analysis',  icon: BarChart3,       label: 'Stock Analysis' },
  { to: '/realestate',icon: Building2,       label: 'Real Estate' },
  { to: '/business',  icon: Briefcase,       label: 'Business' },
  { to: '/family',    icon: Users,           label: 'Family Equity' },
  { to: '/upload',    icon: Upload,          label: 'Upload Data' },
  { to: '/reports',   icon: FileText,        label: 'Reports' },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed top-0 left-0 h-full z-40 w-64',
          'bg-slate-900 dark:bg-slate-950 border-r border-slate-800',
          'flex flex-col transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:relative lg:z-auto',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-sm">Family Office</span>
            </div>
            <p className="text-slate-500 text-xs mt-1 ml-10">Portfolio Tracker</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded text-slate-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium group transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800">
          <p className="text-slate-600 text-xs">v1.0 · Private & Secure</p>
          <p className="text-slate-700 text-xs mt-0.5">Data stored locally</p>
        </div>
      </aside>
    </>
  );
}
