export default function Badge({ label, color = 'blue' }) {
  const colors = {
    blue:    'bg-blue-500/15 text-blue-400 border-blue-500/30',
    green:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    red:     'bg-red-500/15 text-red-400 border-red-500/30',
    amber:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
    purple:  'bg-purple-500/15 text-purple-400 border-purple-500/30',
    slate:   'bg-slate-500/15 text-slate-400 border-slate-500/30',
    cyan:    'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${colors[color] || colors.slate}`}>
      {label}
    </span>
  );
}
