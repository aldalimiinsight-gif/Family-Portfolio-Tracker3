export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-700/50 flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-slate-500" />
        </div>
      )}
      <h3 className="text-white font-semibold text-base mb-1">{title}</h3>
      {description && <p className="text-slate-400 text-sm max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}
