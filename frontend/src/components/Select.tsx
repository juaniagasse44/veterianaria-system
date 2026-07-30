import type { ReactNode } from 'react'

export function Select({
  value,
  onChange,
  children,
}: {
  value?: string
  onChange?: (v: string) => void
  children: ReactNode
}) {
  return (
    <select
      value={value}
      onChange={e => onChange?.(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-900 bg-white transition-shadow"
    >
      {children}
    </select>
  )
}
