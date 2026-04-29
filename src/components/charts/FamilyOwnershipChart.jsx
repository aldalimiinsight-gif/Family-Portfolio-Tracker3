import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fmtPct, fmtCurrency } from '../../utils/calculations';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-white font-semibold text-sm">{d.name}</p>
      <p className="text-slate-300 text-xs">{fmtPct(d.ownershipPct, 1)} ownership</p>
      <p className="text-slate-400 text-xs">Invested: {fmtCurrency(d.totalContribution, 'USD', true)}</p>
      {d.netWorth !== undefined && (
        <p className="text-emerald-400 text-xs font-medium">Net Worth: {fmtCurrency(d.netWorth, 'USD', true)}</p>
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

  const chartData = data.map((m) => ({
    ...m,
    value: m.ownershipPct,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((m, i) => (
            <Cell key={i} fill={m.color || '#3b82f6'} stroke="transparent" />
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
