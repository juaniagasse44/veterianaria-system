import { useMemo, useState, type FormEvent } from 'react'
import { Modal } from '../Modal'
import { FormField } from '../FormField'
import { Input } from '../Input'
import { Select } from '../Select'
import { Btn } from '../Btn'
import { createAppointment } from '../../api/appointments'
import { ApiError } from '../../lib/api'
import { todayApiDate } from '../../utils/helpers'
import type { ApiAppointment, ApiOwner, ApiPet, ApiVeterinarian, AppointmentReason } from '../../types'

const REASON_LABELS: Record<AppointmentReason, string> = {
  CONSULTA: 'Consulta',
  CONTROL: 'Control',
  VACUNACION: 'Vacunación',
  CIRUGIA: 'Cirugía',
  OTRO: 'Otro',
}

const DURATIONS = [15, 30, 45, 60, 90]

export function NuevoTurnoModal({
  pets,
  owners,
  veterinarians,
  defaultDate,
  onClose,
  onSaved,
}: {
  pets: ApiPet[]
  owners: ApiOwner[]
  veterinarians: ApiVeterinarian[]
  defaultDate?: string
  onClose: () => void
  onSaved: (appt: ApiAppointment) => void
}) {
  const [petId, setPetId] = useState('')
  const [veterinarianId, setVeterinarianId] = useState('')
  const [date, setDate] = useState(defaultDate ?? todayApiDate())
  const [time, setTime] = useState('09:00')
  const [duration, setDuration] = useState('30')
  const [reason, setReason] = useState<AppointmentReason>('CONSULTA')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ownerById = useMemo(() => {
    const map = new Map<number, ApiOwner>()
    owners.forEach(o => map.set(o.id, o))
    return map
  }, [owners])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!petId) {
      setError('Elegí la mascota del turno.')
      return
    }
    if (!veterinarianId) {
      setError('Elegí el veterinario.')
      return
    }
    if (!date || !time) {
      setError('Indicá la fecha y la hora del turno.')
      return
    }

    setLoading(true)
    try {
      const startAt = new Date(`${date}T${time}:00`).toISOString()
      const saved = await createAppointment({
        petId: Number(petId),
        veterinarianId: Number(veterinarianId),
        startAt,
        durationMinutes: Number(duration),
        reason,
        notes: notes || undefined,
      })
      onSaved(saved)
    } catch (err) {
      // El backend devuelve mensajes claros para 409 (solapamiento, turno en
      // el pasado) y 404 (mascota/veterinario inactivo) — se muestran tal cual.
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el turno.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Nuevo turno" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Fecha">
            <Input type="date" value={date} onChange={setDate} />
          </FormField>
          <FormField label="Hora">
            <Input type="time" value={time} onChange={setTime} />
          </FormField>
        </div>

        <FormField label="Mascota">
          <Select value={petId} onChange={setPetId}>
            <option value="">— Elegí una mascota —</option>
            {pets.map(p => (
              <option key={p.id} value={String(p.id)}>
                {p.name} — {ownerById.get(p.ownerId)?.fullName ?? '—'}
              </option>
            ))}
          </Select>
          {pets.length === 0 && <p className="text-xs text-slate-400 mt-1">No hay mascotas activas registradas.</p>}
        </FormField>

        <FormField label="Veterinario">
          <Select value={veterinarianId} onChange={setVeterinarianId}>
            <option value="">— Elegí un veterinario —</option>
            {veterinarians.map(v => (
              <option key={v.id} value={String(v.id)}>
                {v.fullName}
                {v.specialty ? ` · ${v.specialty}` : ''}
              </option>
            ))}
          </Select>
          {veterinarians.length === 0 && (
            <p className="text-xs text-slate-400 mt-1">No hay veterinarios activos registrados.</p>
          )}
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Duración estimada">
            <Select value={duration} onChange={setDuration}>
              {DURATIONS.map(d => (
                <option key={d} value={String(d)}>
                  {d} minutos
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Motivo">
            <Select value={reason} onChange={v => setReason(v as AppointmentReason)}>
              {(Object.keys(REASON_LABELS) as AppointmentReason[]).map(r => (
                <option key={r} value={r}>
                  {REASON_LABELS[r]}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Notas previas (opcional)">
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Información relevante antes del turno..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </FormField>

        <div className="flex gap-2 pt-2">
          <Btn type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Confirmar turno'}
          </Btn>
          <Btn type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Btn>
        </div>
      </form>
    </Modal>
  )
}
