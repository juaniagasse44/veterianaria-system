import type { Screen, ApptStatus } from '../types'
import { APPTS, PRODUCTS, VACCINES, VETS, PETS, OWNERS } from '../data/mockData'
import { parseTime, stockStatus, getOwner, getPet, getVet } from '../utils/helpers'
import { KPICard } from '../components/KPICard'
import { Btn } from '../components/Btn'
import { Ico } from '../components/Ico'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'

export function DashboardScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const todayAppts = APPTS.filter(a => a.date === '2026-07-29').sort(
    (a, b) => parseTime(a.time) - parseTime(b.time),
  )
  const lowStock = PRODUCTS.filter(p => stockStatus(p) !== 'OK')
  const vacsDue = VACCINES.filter(v => {
    const diff = (new Date(v.nextDue).getTime() - Date.now()) / 86400000
    return diff >= 0 && diff <= 30
  })

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          label="Turnos hoy"
          value={todayAppts.length}
          sub={`${todayAppts.filter(a => a.status === 'Atendido').length} atendidos · ${todayAppts.filter(a => a.status === 'Pendiente').length} pendientes`}
          icon="calendar"
          color="teal"
        />
        <KPICard
          label="Mascotas registradas"
          value={PETS.length}
          sub={`${OWNERS.length} dueños en sistema`}
          icon="paw"
          color="blue"
        />
        <KPICard
          label="Productos bajo stock"
          value={lowStock.length}
          sub={`${lowStock.filter(p => stockStatus(p) === 'Sin stock').length} sin stock — crítico`}
          icon="layers"
          color="amber"
        />
        <KPICard
          label="Vacunas por vencer"
          value={vacsDue.length}
          sub="Próximos 30 días"
          icon="syringe"
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Today appointments */}
        <div className="xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Turnos del día</h3>
              <p className="text-xs text-slate-400 mt-0.5">Miércoles 29 de julio de 2026</p>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => onNavigate('turnos')}>
              Ver agenda
              <Ico name="chevRight" size={14} />
            </Btn>
          </div>
          <div className="divide-y divide-slate-100">
            {todayAppts.slice(0, 8).map(a => {
              const pet = getPet(a.petId)
              const owner = getOwner(a.ownerId)
              const vet = getVet(a.vetId)
              return (
                <div key={a.id} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="min-w-[44px] text-right">
                    <span className="text-sm font-semibold text-slate-700 tabular-nums">{a.time}</span>
                  </div>
                  <div
                    className="w-0.5 self-stretch rounded-full flex-shrink-0"
                    style={{ backgroundColor: vet?.hue ?? '#0d9488' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {pet?.name}
                      <span className="text-slate-400 font-normal"> · {a.reason}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {owner?.name} · {vet?.name}
                    </p>
                  </div>
                  <Badge status={a.status} />
                </div>
              )
            })}
          </div>
          {todayAppts.length > 8 && (
            <div className="px-5 py-3 border-t border-slate-100 text-center">
              <button
                onClick={() => onNavigate('turnos')}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                Ver {todayAppts.length - 8} turnos más
              </button>
            </div>
          )}
        </div>

        {/* Low stock alerts */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ico name="alert" size={15} className="text-amber-500 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-slate-900">Alertas de stock</h3>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => onNavigate('stock')}>
              Ver stock
              <Ico name="chevRight" size={14} />
            </Btn>
          </div>
          <div className="divide-y divide-slate-100">
            {lowStock.length === 0 ? (
              <EmptyState
                icon="check"
                title="Stock normalizado"
                description="Todos los productos están en niveles adecuados."
              />
            ) : (
              lowStock.map(p => (
                <div key={p.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {p.qty} {p.unit} · mín. {p.min}
                    </p>
                  </div>
                  <Badge status={stockStatus(p)} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Distribución de turnos</h4>
          <div className="space-y-2.5">
            {(
              [
                ['Atendidos', 'Atendido', 'bg-teal-500'],
                ['Confirmados', 'Confirmado', 'bg-blue-500'],
                ['Pendientes', 'Pendiente', 'bg-amber-400'],
                ['Cancelados', 'Cancelado', 'bg-red-400'],
              ] as [string, ApptStatus, string][]
            ).map(([label, status, bg]) => {
              const count = todayAppts.filter(a => a.status === status).length
              const pct = todayAppts.length ? Math.round((count / todayAppts.length) * 100) : 0
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${bg}`} />
                  <span className="text-sm text-slate-600 flex-1">{label}</span>
                  <span className="text-sm font-semibold text-slate-800 tabular-nums">{count}</span>
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${bg}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Turnos por veterinario</h4>
          <div className="space-y-2.5">
            {VETS.map(v => {
              const count = todayAppts.filter(a => a.vetId === v.id).length
              const pct = todayAppts.length ? Math.round((count / todayAppts.length) * 100) : 0
              return (
                <div key={v.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: v.hue }} />
                  <span className="text-sm text-slate-600 flex-1 truncate">{v.name.replace('Dra. ', '').replace('Dr. ', '')}</span>
                  <span className="text-sm font-semibold text-slate-800 tabular-nums">{count}</span>
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: v.hue }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-teal-600 rounded-xl p-5 shadow-sm text-white">
          <h4 className="text-xs font-semibold text-teal-200 uppercase tracking-wide mb-1">Próximo turno</h4>
          {(() => {
            const next = todayAppts.find(a => a.status === 'Pendiente' || a.status === 'Confirmado')
            if (!next) return <p className="text-teal-200 text-sm mt-2">No hay turnos pendientes.</p>
            const pet = getPet(next.petId)
            const owner = getOwner(next.ownerId)
            const vet = getVet(next.vetId)
            return (
              <div className="mt-2 space-y-1.5">
                <p className="text-xl font-bold tabular-nums">{next.time} hs</p>
                <p className="text-base font-semibold text-white">{pet?.name}</p>
                <p className="text-sm text-teal-100">{next.reason}</p>
                <p className="text-xs text-teal-200">{owner?.name} · {vet?.name}</p>
                <div className="pt-2">
                  <Badge status={next.status} />
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
