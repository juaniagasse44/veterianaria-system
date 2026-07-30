import type { ReactNode } from 'react'
import { Ico } from './Ico'

export function EmptyState({
  icon = 'search',
  title,
  description,
  action,
}: {
  icon?: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <Ico name={icon} size={18} className="text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-600">{title}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
