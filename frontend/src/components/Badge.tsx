export function Badge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pendiente: 'bg-amber-50 text-amber-700 border border-amber-200',
    Confirmado: 'bg-blue-50 text-blue-700 border border-blue-200',
    Atendido: 'bg-teal-50 text-teal-700 border border-teal-200',
    Cancelado: 'bg-red-50 text-red-500 border border-red-200',
    OK: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Bajo: 'bg-amber-50 text-amber-700 border border-amber-200',
    'Sin stock': 'bg-red-50 text-red-600 border border-red-200',
    Vigente: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'Por vencer': 'bg-amber-50 text-amber-700 border border-amber-200',
    Vencida: 'bg-red-50 text-red-600 border border-red-200',
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
        styles[status] ?? 'bg-slate-100 text-slate-600 border border-slate-200'
      }`}
    >
      {status}
    </span>
  )
}
