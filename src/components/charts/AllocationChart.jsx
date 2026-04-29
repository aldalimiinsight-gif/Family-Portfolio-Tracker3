import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fmtCurrency, fmtPct } from '../../utils/calculations';

const COLORS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-slate-300 text-xs font-medium">{d.name}</p>
      <p className="text-white font-bold text-sm">{fmtCurrency(d.value, 'USD', true)}</p>
      <p className="text-slate-400 text-xs">{fmtPct(d.payload.pct, 1)}</p>
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
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={3}
          dataKey="value"
          label={renderLabel}
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(v) => <span className="text-slate-300 text-xs">{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
