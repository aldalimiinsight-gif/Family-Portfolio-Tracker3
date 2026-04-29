export default function MetricCard({ label, value, sub, icon: Icon, iconBg = 'bg-blue-500/20', iconColor = 'text-blue-400', trend, trendLabel, compact = false }) {
  const trendColor = trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-slate-400';
  const trendSign = trend > 0 ? '+' : '';

  return (
    <div className="bg-slate-800 dark:bg-slate-900 rounded-xl p-5 border border-slate-700/50 card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-white font-bold ${compact ? 'text-xl' : 'text-2xl'} num leading-tight`}>{value}</p>
          {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
          {trend !== undefined && (
            <p className={`text-xs mt-1 font-medium ${trendColor}`}>
              {trendSign}{trend?.toFixed(2)}% {trendLabel && <span className="text-slate-500 font-normal">{trendLabel}</span>}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${iconBg} shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        )}
      </div>
    </div>
  );
}
