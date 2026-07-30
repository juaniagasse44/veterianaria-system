export function Input({
  placeholder,
  value,
  onChange,
  type = 'text',
}: {
  placeholder?: string
  value?: string
  onChange?: (v: string) => void
  type?: string
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-900 placeholder:text-slate-400 bg-white transition-shadow"
    />
  )
}
