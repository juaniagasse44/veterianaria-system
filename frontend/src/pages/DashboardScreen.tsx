import { useEffect, useMemo, useState } from 'react'
import type {
  ApiAppointment,
  ApiOwner,
  ApiStockLevel,
  ApiVaccination,
  ApiVeterinarian,
  AppointmentReason,
  AppointmentStatus,
  Screen,
} from '../types'
import { listAppointments } from '../api/appointments'
import { listPets } from '../api/pets'
import { listOwners } from '../api/owners'
import { listVeterinarians } from '../api/veterinarians'
import { listLowStock } from '../api/stock'
import { listUpcomingVaccinations } from '../api/vaccinations'
import { ApiError } from '../lib/api'
import { colorForId, formatApiTime, formatWeekdayDate, todayApiDate } from '../utils/helpers'
import { KPICard } from '../components/KPICard'
import { Btn } from '../components/Btn'
import { Ico } from '../components/Ico'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  ATENDIDO: 'Atendido',
  CANCELADO: 'Cancelado',
}

const REASON_LABELS: Record<AppointmentReason, string> = {
  CONSULTA: 'Consulta',
  CONTROL: 'Control',
  VACUNACION: 'Vacunación',
  CIRUGIA: 'Cirugía',
  OTRO: 'Otro',
}

const DISTRIBUTION: [string, AppointmentStatus, string][] = [
  ['Atendidos', 'ATENDIDO', 'bg-teal-500'],
  ['Confirmados', 'CONFIRMADO', 'bg-blue-500'],
  ['Pendientes', 'PENDIENTE', 'bg-amber-400'],
  ['Cancelados', 'CANCELADO', 'bg-red-400'],
]

const VACCINES_DUE_DAYS = 30

export function DashboardScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [todayAppts, setTodayAppts] = useState<ApiAppointment[]>([])
  const [petsTotal, setPetsTotal] = useState(0)
  const [owners, setOwners] = useState<ApiOwner[]>([])
  const [veterinarians, setVeterinarians] = useState<ApiVeterinarian[]>([])
  const [lowStock, setLowStock] = useState<ApiStockLevel[]>([])
  const [vaccinesDue, setVaccinesDue] = useState<ApiVaccination[]>([])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const today = todayApiDate()
      const [apptsResult, petsResult, ownersActive, ownersInactive, vetsResult, lowStockResult, vaccinesResult] =
        await Promise.all([
          listAppointments({ date: today }),
          listPets({ limit: 1 }),
          listOwners({ active: true, limit: 200 }),
          listOwners({ active: false, limit: 200 }),
          listVeterinarians({ active: true, limit: 200 }),
          listLowStock(),
          listUpcomingVaccinations({ days: VACCINES_DUE_DAYS }),
        ])
      setTodayAppts(apptsResult)
      setPetsTotal(petsResult.total)
      setOwners([...ownersActive.data, ...ownersInactive.data])
      setVeterinarians(vetsResult.data)
      setLowStock(lowStockResult)
      setVaccinesDue(vaccinesResult)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const ownerById = useMemo(() => {
    const map = new Map<number, ApiOwner>()
    owners.forEach(o => map.set(o.id, o))
    return map
  }, [owners])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <EmptyState icon="clock" title="Cargando..." description="Reuniendo los datos del dashboard." />
      </div>
    )
  }
  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <EmptyState
          icon="alert"
          title="No se pudo cargar"
          description={error}
          action={
            <Btn variant="outline" size="sm" onClick={load}>
              Reintentar
            </Btn>
          }
        />
      </div>
    )
  }

  const next = todayAppts.find(a => a.status === 'PENDIENTE' || a.status === 'CONFIRMADO')

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          label="Turnos hoy"
          value={todayAppts.length}
          sub={`${todayAppts.filter(a => a.status === 'ATENDIDO').length} atendidos · ${todayAppts.filter(a => a.status === 'PENDIENTE').length} pendientes`}
          icon="calendar"
          color="teal"
        />
        <KPICard
          label="Mascotas registradas"
          value={petsTotal}
          sub={`${owners.filter(o => o.active).length} dueños en sistema`}
          icon="paw"
          color="blue"
        />
        <KPICard
          label="Productos bajo stock"
          value={lowStock.length}
          sub={`${lowStock.filter(s => s.quantity === 0).length} sin stock — crítico`}
          icon="layers"
          color="amber"
        />
        <KPICard label="Vacunas por vencer" value={vaccinesDue.length} sub={`Próximos ${VACCINES_DUE_DAYS} días`} icon="syringe" color="red" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Today appointments */}
        <div className="xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Turnos del día</h3>
              <p className="text-xs text-slate-400 mt-0.5 capitalize">{formatWeekdayDate(todayApiDate())}</p>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => onNavigate('turnos')}>
              Ver agenda
              <Ico name="chevRight" size={14} />
            </Btn>
          </div>
          {todayAppts.length === 0 ? (
            <EmptyState icon="calendar" title="Sin turnos" description="No hay turnos para hoy." />
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {todayAppts.slice(0, 8).map(a => (
                  <div key={a.id} className="px-5 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="min-w-[44px] text-right">
                      <span className="text-sm font-semibold text-slate-700 tabular-nums">{formatApiTime(a.startAt)}</span>
                    </div>
                    <div
                      className="w-0.5 self-stretch rounded-full flex-shrink-0"
                      style={{ backgroundColor: colorForId(a.veterinarianId) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {a.pet.name}
                        <span className="text-slate-400 font-normal"> · {REASON_LABELS[a.reason]}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {ownerById.get(a.pet.ownerId)?.fullName ?? '—'} · {a.veterinarian.fullName}
                      </p>
                    </div>
                    <Badge status={STATUS_LABELS[a.status]} />
                  </div>
                ))}
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
            </>
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
              lowStock.map(s => (
                <div key={s.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{s.product.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {s.quantity} {s.product.unit} · mín. {s.minQuantity}
                    </p>
                  </div>
                  <Badge status={s.quantity === 0 ? 'Sin stock' : 'Bajo'} />
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
            {DISTRIBUTION.map(([label, status, bg]) => {
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
          {veterinarians.length === 0 ? (
            <p className="text-sm text-slate-400">No hay veterinarios activos.</p>
          ) : (
            <div className="space-y-2.5">
              {veterinarians.map(v => {
                const count = todayAppts.filter(a => a.veterinarianId === v.id).length
                const pct = todayAppts.length ? Math.round((count / todayAppts.length) * 100) : 0
                const color = colorForId(v.id)
                return (
                  <div key={v.id} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-sm text-slate-600 flex-1 truncate">{v.fullName}</span>
                    <span className="text-sm font-semibold text-slate-800 tabular-nums">{count}</span>
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-teal-600 rounded-xl p-5 shadow-sm text-white">
          <h4 className="text-xs font-semibold text-teal-200 uppercase tracking-wide mb-1">Próximo turno</h4>
          {!next ? (
            <p className="text-teal-200 text-sm mt-2">No hay turnos pendientes.</p>
          ) : (
            <div className="mt-2 space-y-1.5">
              <p className="text-xl font-bold tabular-nums">{formatApiTime(next.startAt)} hs</p>
              <p className="text-base font-semibold text-white">{next.pet.name}</p>
              <p className="text-sm text-teal-100">{REASON_LABELS[next.reason]}</p>
              <p className="text-xs text-teal-200">
                {ownerById.get(next.pet.ownerId)?.fullName ?? '—'} · {next.veterinarian.fullName}
              </p>
              <div className="pt-2">
                <Badge status={STATUS_LABELS[next.status]} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
