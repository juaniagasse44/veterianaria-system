import { useEffect, useMemo, useRef, useState } from 'react'
import type { ApiAppointment, ApiOwner, ApiPet, ApiVeterinarian, AppointmentStatus } from '../types'
import { listAppointments, changeAppointmentStatus, cancelAppointment } from '../api/appointments'
import { listVeterinarians } from '../api/veterinarians'
import { listPets } from '../api/pets'
import { listOwners } from '../api/owners'
import { ApiError } from '../lib/api'
import { formatApiTime, formatDateInput, formatWeekdayDate, todayApiDate } from '../utils/helpers'
import { Btn } from '../components/Btn'
import { Ico } from '../components/Ico'
import { Select } from '../components/Select'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { NuevoTurnoModal } from '../components/modals/NuevoTurnoModal'

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  ATENDIDO: 'Atendido',
  CANCELADO: 'Cancelado',
}

const REASON_LABELS: Record<string, string> = {
  CONSULTA: 'Consulta',
  CONTROL: 'Control',
  VACUNACION: 'Vacunación',
  CIRUGIA: 'Cirugía',
  OTRO: 'Otro',
}

const STATUS_BORDER: Record<AppointmentStatus, string> = {
  PENDIENTE: '#f59e0b',
  CONFIRMADO: '#3b82f6',
  ATENDIDO: '#0d9488',
  CANCELADO: '#ef4444',
}

const LEGEND: [AppointmentStatus, string][] = [
  ['ATENDIDO', 'bg-teal-500'],
  ['CONFIRMADO', 'bg-blue-500'],
  ['PENDIENTE', 'bg-amber-400'],
  ['CANCELADO', 'bg-red-400'],
]

export function TurnosScreen() {
  const [date, setDate] = useState(todayApiDate())
  const [vetFilter, setVetFilter] = useState('')
  const [appointments, setAppointments] = useState<ApiAppointment[]>([])
  const [veterinarians, setVeterinarians] = useState<ApiVeterinarian[]>([])
  const [pets, setPets] = useState<ApiPet[]>([])
  const [owners, setOwners] = useState<ApiOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const requestId = useRef(0)

  async function load() {
    const thisRequest = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const [apptsResult, vetsResult, petsResult, ownersActive, ownersInactive] = await Promise.all([
        listAppointments({ date, veterinarianId: vetFilter ? Number(vetFilter) : undefined }),
        listVeterinarians({ active: true, limit: 200 }),
        listPets({ active: true, limit: 200 }),
        listOwners({ active: true, limit: 200 }),
        listOwners({ active: false, limit: 200 }),
      ])
      if (thisRequest !== requestId.current) return
      setAppointments(apptsResult)
      setVeterinarians(vetsResult.data)
      setPets(petsResult.data)
      setOwners([...ownersActive.data, ...ownersInactive.data])
    } catch (err) {
      if (thisRequest !== requestId.current) return
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar la agenda.')
    } finally {
      if (thisRequest === requestId.current) setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, vetFilter])

  // Los dueños de mascotas con turno pueden estar dados de baja; se combinan
  // activos e inactivos para siempre poder mostrar el nombre (mismo patrón
  // que MascotasScreen/VeterinariosScreen).
  const ownerById = useMemo(() => {
    const map = new Map<number, ApiOwner>()
    owners.forEach(o => map.set(o.id, o))
    return map
  }, [owners])

  function shiftDate(days: number) {
    const d = new Date(`${date}T00:00:00`)
    d.setDate(d.getDate() + days)
    setDate(formatDateInput(d))
  }

  async function handleStatus(appt: ApiAppointment, status: AppointmentStatus) {
    setActionError(null)
    try {
      await changeAppointmentStatus(appt.id, status)
      await load()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'No se pudo actualizar el turno.')
    }
  }

  async function handleCancel(appt: ApiAppointment) {
    if (!window.confirm(`¿Cancelar el turno de "${appt.pet.name}"?`)) return
    setActionError(null)
    try {
      await cancelAppointment(appt.id)
      await load()
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'No se pudo cancelar el turno.')
    }
  }

  function handleSaved() {
    setShowModal(false)
    load()
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => shiftDate(-1)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors bg-white"
          >
            <Ico name="chevLeft" size={15} />
          </button>
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <Ico name="calendar" size={14} className="text-slate-400" />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="text-sm font-semibold text-slate-900 border-none outline-none bg-transparent"
            />
          </div>
          <button
            onClick={() => shiftDate(1)}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors bg-white"
          >
            <Ico name="chevRight" size={15} />
          </button>
          <span className="text-xs text-slate-400 ml-1">
            {formatWeekdayDate(date)} · {appointments.length} turnos
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-56">
            <Select value={vetFilter} onChange={setVetFilter}>
              <option value="">Todos los veterinarios</option>
              {veterinarians.map(v => (
                <option key={v.id} value={String(v.id)}>
                  {v.fullName}
                </option>
              ))}
            </Select>
          </div>
          <Btn onClick={() => setShowModal(true)}>
            <Ico name="plus" size={15} />
            Nuevo turno
          </Btn>
        </div>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{actionError}</div>
      )}

      {/* Agenda */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <EmptyState icon="clock" title="Cargando..." description="Buscando los turnos del día." />
        ) : error ? (
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
        ) : appointments.length === 0 ? (
          <EmptyState icon="calendar" title="Sin turnos" description="No hay turnos agendados para este día." />
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map(appt => (
              <div
                key={appt.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors"
                style={{
                  borderLeft: `3px solid ${STATUS_BORDER[appt.status]}`,
                  opacity: appt.status === 'CANCELADO' ? 0.6 : 1,
                }}
              >
                <div className="w-14 flex-shrink-0 text-sm font-semibold text-slate-800 tabular-nums">
                  {formatApiTime(appt.startAt)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-800 truncate">{appt.pet.name}</p>
                    <Badge status={STATUS_LABELS[appt.status]} />
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {ownerById.get(appt.pet.ownerId)?.fullName ?? '—'} · {appt.veterinarian.fullName} ·{' '}
                    {REASON_LABELS[appt.reason] ?? appt.reason}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {appt.status === 'PENDIENTE' && (
                    <Btn size="sm" variant="outline" onClick={() => handleStatus(appt, 'CONFIRMADO')}>
                      Confirmar
                    </Btn>
                  )}
                  {appt.status === 'CONFIRMADO' && (
                    <Btn size="sm" variant="outline" onClick={() => handleStatus(appt, 'ATENDIDO')}>
                      Marcar atendido
                    </Btn>
                  )}
                  {(appt.status === 'PENDIENTE' || appt.status === 'CONFIRMADO') && (
                    <Btn size="sm" variant="danger" onClick={() => handleCancel(appt)}>
                      Cancelar
                    </Btn>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status legend */}
      <div className="flex items-center gap-5 flex-wrap">
        {LEGEND.map(([s, bg]) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${bg}`} />
            <span className="text-xs text-slate-500">{STATUS_LABELS[s]}</span>
          </div>
        ))}
      </div>

      {showModal && (
        <NuevoTurnoModal
          pets={pets}
          owners={owners}
          veterinarians={veterinarians}
          defaultDate={date}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
