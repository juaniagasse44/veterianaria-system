import { useState, type FormEvent } from 'react'
import { Modal } from '../Modal'
import { FormField } from '../FormField'
import { Input } from '../Input'
import { Select } from '../Select'
import { Btn } from '../Btn'
import { createVeterinarian, updateVeterinarian } from '../../api/veterinarians'
import { ApiError } from '../../lib/api'
import type { ApiVeterinarian } from '../../types'

const SPECIALTY_PRESETS = [
  'Clínica General',
  'Cirugía',
  'Dermatología',
  'Traumatología',
  'Cardiología',
  'Oftalmología',
  'Oncología',
  'Otra',
]

export function NuevoVetModal({
  vet,
  onClose,
  onSaved,
}: {
  vet?: ApiVeterinarian
  onClose: () => void
  onSaved: (vet: ApiVeterinarian) => void
}) {
  const isEdit = !!vet
  const [fullName, setFullName] = useState(vet?.fullName ?? '')
  const [licenseNumber, setLicenseNumber] = useState(vet?.licenseNumber ?? '')
  const [specialty, setSpecialty] = useState(vet?.specialty ?? '')
  const [phone, setPhone] = useState(vet?.phone ?? '')
  const [email, setEmail] = useState(vet?.email ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Si el veterinario ya tiene una especialidad que no está en la lista fija
  // (ej. cargada antes de existir este preset), la agregamos para no perderla
  // ni pisarla silenciosamente al guardar.
  const specialtyOptions =
    specialty && !SPECIALTY_PRESETS.includes(specialty) ? [specialty, ...SPECIALTY_PRESETS] : SPECIALTY_PRESETS

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (fullName.trim().length < 2) {
      setError('El nombre completo es obligatorio (mínimo 2 caracteres).')
      return
    }

    setLoading(true)
    try {
      const input = { fullName, licenseNumber, specialty, phone, email }
      const saved = isEdit ? await updateVeterinarian(vet.id, input) : await createVeterinarian(input)
      onSaved(saved)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el veterinario.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Editar veterinario' : 'Nuevo veterinario'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <FormField label="Nombre completo">
          <Input placeholder="Ej. Dra. Ana López" value={fullName} onChange={setFullName} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Matrícula">
            <Input placeholder="Ej. MV-12.345" value={licenseNumber} onChange={setLicenseNumber} />
          </FormField>
          <FormField label="Especialidad">
            <Select value={specialty} onChange={setSpecialty}>
              <option value="">— Sin especificar —</option>
              {specialtyOptions.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Teléfono">
            <Input placeholder="Ej. 11 4523-8901" value={phone} onChange={setPhone} />
          </FormField>
          <FormField label="Email">
            <Input type="email" placeholder="nombre@clinica.com.ar" value={email} onChange={setEmail} />
          </FormField>
        </div>
        <div className="flex gap-2 pt-2">
          <Btn type="submit" disabled={loading}>
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar veterinario'}
          </Btn>
          <Btn type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Btn>
        </div>
      </form>
    </Modal>
  )
}
