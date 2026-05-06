import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fmtPct, fmtCurrency } from '../../utils/calculations';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div
      className="rounded-xl px-3.5 py-2.5 shadow-2xl"
      style={{
        background: 'linear-gradient(145deg, rgba(13,26,48,0.98), rgba(8,14,28,0.95))',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <p className="text-white font-semibold text-sm mb-1">{d.name}</p>
      <p className="text-slate-400 text-xs num">{fmtPct(d.ownershipPct, 1)} ownership</p>
      <p className="text-slate-500 text-xs num">Invested: {fmtCurrency(d.totalContribution, 'USD', true)}</p>
      {d.netWorth !== undefined && (
        <p className="text-emerald-400 text-xs font-medium num">Net Worth: {fmtCurrency(d.netWorth, 'USD', true)}</p>
      )}
    </div>
  );
};

export default function FamilyOwnershipChart({ data }) {
  if (!data?.length || data.every((d) => d.totalContribution === 0)) {
    return (
      <div className="flex items-center justify-center h-56 text-slate-500 text-sm">
        No contribution data yet
      </div>
    );
  }

  const chartData = data.map((m) => ({ ...m, value: m.ownershipPct }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={58}
          outerRadius={92}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {chartData.map((m, i) => (
            <Cell key={i} fill={m.color || '#6366f1'} stroke="transparent" />
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
