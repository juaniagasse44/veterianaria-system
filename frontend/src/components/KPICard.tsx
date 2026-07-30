import { Ico } from './Ico'

export function KPICard({
  label,
  value,
  sub,
  icon,
  color = 'teal',
}: {
  label: string
  value: string | number
  sub?: string
  icon: string
  color?: string
}) {
  const colorMap: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-emerald-50 text-emerald-600',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-2.5 rounded-lg flex-shrink-0 ${colorMap[color] ?? colorMap.teal}`}>
        <Ico name={icon} size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-500 font-medium leading-snug">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}
