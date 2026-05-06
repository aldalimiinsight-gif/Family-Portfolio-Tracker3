import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fmtCurrency, fmtPct } from '../../utils/calculations';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div
      className="rounded-xl px-3.5 py-2.5 shadow-2xl"
      style={{
        background: 'linear-gradient(145deg, rgba(13,26,48,0.98), rgba(8,14,28,0.95))',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <p className="text-slate-400 text-xs font-medium mb-1">{d.name}</p>
      <p className="text-white font-bold text-sm num">{fmtCurrency(d.value, 'USD', true)}</p>
      <p className="text-slate-500 text-xs num">{fmtPct(d.payload.pct, 1)}</p>
    </div>
  );
};

const renderLabel = ({ name, pct }) => (pct > 5 ? `${pct.toFixed(1)}%` : '');

export default function AllocationChart({ data }) {
  const hasData = data && data.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-56 text-slate-500 text-sm">
        No allocation data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <defs>
          {COLORS.map((c, i) => (
            <radialGradient key={i} id={`pieGrad${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={c} stopOpacity={1} />
              <stop offset="100%" stopColor={c} stopOpacity={0.7} />
            </radialGradient>
          ))}
        </defs>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={62}
          outerRadius={96}
          paddingAngle={3}
          dataKey="value"
          label={renderLabel}
          labelLine={false}
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={`url(#pieGrad${i % COLORS.length})`} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={7}
          formatter={(v) => <span style={{ color: '#6488a8', fontSize: 11 }}>{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
