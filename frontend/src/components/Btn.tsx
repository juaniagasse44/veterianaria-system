import type { ReactNode } from 'react'

export function Btn({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  className?: string
}) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded-lg transition-colors cursor-pointer border select-none'
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' }
  const variants = {
    primary: 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700 active:bg-teal-800',
    outline: 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 active:bg-slate-100',
    ghost: 'bg-transparent text-slate-600 border-transparent hover:bg-slate-100 active:bg-slate-200',
    danger: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100',
  }
  return (
    <button onClick={onClick} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}
