import { useState, type FormEvent } from 'react'
import { Modal } from '../Modal'
import { FormField } from '../FormField'
import { Input } from '../Input'
import { Btn } from '../Btn'
import { createOwner, updateOwner } from '../../api/owners'
import { ApiError } from '../../lib/api'
import type { ApiOwner } from '../../types'

export function NuevoDuenoModal({
  owner,
  onClose,
  onSaved,
}: {
  owner?: ApiOwner
  onClose: () => void
  onSaved: (owner: ApiOwner) => void
}) {
  const isEdit = !!owner
  const [fullName, setFullName] = useState(owner?.fullName ?? '')
  const [document, setDocument] = useState(owner?.document ?? '')
  const [phone, setPhone] = useState(owner?.phone ?? '')
  const [email, setEmail] = useState(owner?.email ?? '')
  const [address, setAddress] = useState(owner?.address ?? '')
  const [notes, setNotes] = useState(owner?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (fullName.trim().length < 2) {
      setError('El nombre completo es obligatorio (mínimo 2 caracteres).')
      return
    }

    setLoading(true)
    try {
      const input = { fullName, document, phone, email, address, notes }
      const saved = isEdit ? await updateOwner(owner.id, input) : await createOwner(input)
      onSaved(saved)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el dueño.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Editar propietario' : 'Nuevo propietario'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <FormField label="Nombre completo">
          <Input placeholder="Ej. Juan Martínez" value={fullName} onChange={setFullName} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="DNI">
            <Input placeholder="Ej. 35.890.123" value={document} onChange={setDocument} />
          </FormField>
          <FormField label="Teléfono">
            <Input placeholder="Ej. 11 4523-8901" value={phone} onChange={setPhone} />
          </FormField>
        </div>
        <FormField label="Email">
          <Input type="email" placeholder="email@ejemplo.com" value={email} onChange={setEmail} />
        </FormField>
        <FormField label="Dirección">
          <Input placeholder="Calle, número, barrio" value={address} onChange={setAddress} />
        </FormField>
        <FormField label="Notas (opcional)">
          <textarea
            rows={2}
            placeholder="Información adicional del propietario..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </FormField>
        <div className="flex gap-2 pt-2">
          <Btn type="submit" disabled={loading}>
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Registrar dueño'}
          </Btn>
          <Btn type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Btn>
        </div>
      </form>
    </Modal>
  )
}
