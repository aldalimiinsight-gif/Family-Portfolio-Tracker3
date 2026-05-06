import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { PortfolioProvider, usePortfolio } from './context/PortfolioContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import Analysis from './pages/Analysis';
import RealEstate from './pages/RealEstate';
import Business from './pages/Business';
import Family from './pages/Family';
import Upload from './pages/Upload';
import Reports from './pages/Reports';

const PAGE_TITLES = {
  '/':           'Dashboard',
  '/stocks':     'Stock Portfolio',
  '/analysis':   'Stock Analysis',
  '/realestate': 'Real Estate',
  '/business':   'Private Business',
  '/family':     'Family Equity',
  '/upload':     'Upload Data',
  '/reports':    'Executive Report',
};

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Portfolio';
  const { state, dispatch } = usePortfolio();

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />

        {state.stocks.length === 0 && state.members.length === 0 && (
          <div
            className="px-4 py-2.5 flex items-center justify-between gap-4 shrink-0"
            style={{
              background: 'linear-gradient(90deg, rgba(212,160,23,0.08), rgba(212,160,23,0.03))',
              borderBottom: '1px solid rgba(212,160,23,0.15)',
            }}
          >
            <p className="text-sm" style={{ color: '#d4a017' }}>
              <span className="font-semibold">Welcome!</span>{' '}
              <span className="text-slate-400">Load sample data to explore, or start adding your own investments.</span>
            </p>
            <button
              onClick={() => dispatch({ type: 'LOAD_SAMPLE_DATA' })}
              className="shrink-0 px-3 py-1.5 rounded-lg text-white text-xs font-semibold btn-gold"
            >
              Load Sample Data
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/stocks"     element={<Stocks />} />
            <Route path="/analysis"   element={<Analysis />} />
            <Route path="/realestate" element={<RealEstate />} />
            <Route path="/business"   element={<Business />} />
            <Route path="/family"     element={<Family />} />
            <Route path="/upload"     element={<Upload />} />
            <Route path="/reports"    element={<Reports />} />
          </Routes>
        </main>
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            borderRadius: '12px',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1e293b' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <PortfolioProvider>
          <AppShell />
        </PortfolioProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
