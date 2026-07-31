import { useState, type FormEvent } from 'react'
import { Modal } from '../Modal'
import { FormField } from '../FormField'
import { Input } from '../Input'
import { Btn } from '../Btn'
import { createConsultation } from '../../api/consultations'
import { ApiError } from '../../lib/api'
import type { ApiConsultation } from '../../types'

export function NuevaConsultaModal({
  petId,
  petName,
  onClose,
  onSaved,
}: {
  petId: number
  petName: string
  onClose: () => void
  onSaved: (consultation: ApiConsultation) => void
}) {
  const [reason, setReason] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [treatment, setTreatment] = useState('')
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const saved = await createConsultation({
        petId,
        reason: reason || undefined,
        diagnosis: diagnosis || undefined,
        treatment: treatment || undefined,
        weight: weight ? Number(weight) : undefined,
        notes: notes || undefined,
      })
      onSaved(saved)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la consulta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={`Nueva consulta — ${petName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>
        )}

        <FormField label="Peso (kg)">
          <Input type="number" placeholder="Ej. 12.5" value={weight} onChange={setWeight} />
        </FormField>

        <FormField label="Motivo de consulta">
          <Input
            placeholder="Ej. Control anual, revisión post-operatoria..."
            value={reason}
            onChange={setReason}
          />
        </FormField>

        <FormField label="Diagnóstico">
          <textarea
            rows={2}
            value={diagnosis}
            onChange={e => setDiagnosis(e.target.value)}
            placeholder="Diagnóstico del veterinario..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </FormField>

        <FormField label="Tratamiento indicado">
          <textarea
            rows={2}
            value={treatment}
            onChange={e => setTreatment(e.target.value)}
            placeholder="Medicación, procedimientos, indicaciones..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </FormField>

        <FormField label="Notas adicionales">
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Observaciones, indicaciones al propietario..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </FormField>

        <div className="flex gap-2 pt-2">
          <Btn type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar consulta'}
          </Btn>
          <Btn type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Btn>
        </div>
      </form>
    </Modal>
  )
}
