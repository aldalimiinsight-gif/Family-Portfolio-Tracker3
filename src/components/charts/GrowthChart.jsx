import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { fmtCurrency } from '../../utils/calculations';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3.5 py-2.5 shadow-2xl"
      style={{
        background: 'linear-gradient(145deg, rgba(13,26,48,0.98), rgba(8,14,28,0.95))',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <p className="text-slate-500 text-xs mb-1">{label}</p>
      <p className="text-white font-bold text-sm num">{fmtCurrency(payload[0]?.value, 'USD', true)}</p>
    </div>
  );
};

export default function GrowthChart({ data }) {
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        No historical data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a017" stopOpacity={0.35} />
            <stop offset="60%" stopColor="#d4a017" stopOpacity={0.08} />
            <stop offset="100%" stopColor="#d4a017" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#385270', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#385270', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#d4a017"
          strokeWidth={2}
          fill="url(#growthGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#f5d060', stroke: '#d4a017', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
