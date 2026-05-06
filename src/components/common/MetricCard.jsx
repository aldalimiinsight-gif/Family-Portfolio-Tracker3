const VARIANTS = {
  blue:    { top: 'linear-gradient(90deg,#3b82f6,#60a5fa)', glow: 'rgba(59,130,246,0.15)',  icon: 'rgba(59,130,246,0.12)',  iconText: 'text-blue-400' },
  indigo:  { top: 'linear-gradient(90deg,#6366f1,#818cf8)', glow: 'rgba(99,102,241,0.15)',  icon: 'rgba(99,102,241,0.12)',  iconText: 'text-indigo-400' },
  violet:  { top: 'linear-gradient(90deg,#8b5cf6,#a78bfa)', glow: 'rgba(139,92,246,0.15)',  icon: 'rgba(139,92,246,0.12)', iconText: 'text-violet-400' },
  emerald: { top: 'linear-gradient(90deg,#10b981,#34d399)', glow: 'rgba(52,211,153,0.12)',  icon: 'rgba(16,185,129,0.12)', iconText: 'text-emerald-400' },
  amber:   { top: 'linear-gradient(90deg,#f59e0b,#fbbf24)', glow: 'rgba(251,191,36,0.12)',  icon: 'rgba(245,158,11,0.12)', iconText: 'text-amber-400' },
  rose:    { top: 'linear-gradient(90deg,#f43f5e,#fb7185)', glow: 'rgba(244,63,94,0.12)',   icon: 'rgba(244,63,94,0.12)',  iconText: 'text-rose-400' },
  cyan:    { top: 'linear-gradient(90deg,#06b6d4,#22d3ee)', glow: 'rgba(6,182,212,0.12)',   icon: 'rgba(6,182,212,0.12)',  iconText: 'text-cyan-400' },
};

export default function MetricCard({
  label, value, sub, icon: Icon,
  variant = 'blue',
  trend, trendLabel,
}) {
  const v = VARIANTS[variant] || VARIANTS.blue;
  const trendPositive = trend > 0;
  const trendNeutral = trend === 0 || trend === undefined;
  const trendColor = trendPositive ? 'text-emerald-400' : trendNeutral ? 'text-slate-500' : 'text-rose-400';

  return (
    <div
      className="relative rounded-xl overflow-hidden group"
      style={{
        background: 'linear-gradient(145deg, rgba(11,21,40,0.95), rgba(8,14,28,0.9))',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset',
        transition: 'border-color 0.25s, box-shadow 0.25s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `rgba(${v.glow.match(/[\d.]+/g).slice(0,3).join(',')}, 0.3)`;
        e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px ${v.glow}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset';
      }}
    >
      {/* Colored top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: v.top }} />

      <div className="px-5 pt-5 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="section-label mb-2">{label}</p>
            <p
              className="font-bold text-2xl num leading-none mb-1"
              style={{
                background: 'linear-gradient(135deg, #f0f6ff 0%, #94b3cc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {value}
            </p>
            {sub && <p className="text-slate-500 text-xs mt-1.5">{sub}</p>}
            {trend !== undefined && (
              <p className={`text-xs mt-1.5 font-medium flex items-center gap-1 ${trendColor}`}>
                <span>{trendPositive ? '▲' : trendNeutral ? '—' : '▼'}</span>
                <span className="num">{Math.abs(trend).toFixed(2)}%</span>
                {trendLabel && <span className="text-slate-500 font-normal">{trendLabel}</span>}
              </p>
            )}
          </div>

          {Icon && (
            <div
              className="p-2.5 rounded-xl shrink-0"
              style={{ background: v.icon }}
            >
              <Icon className={`w-5 h-5 ${v.iconText}`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
