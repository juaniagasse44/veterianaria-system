import { useMemo, useState, type FormEvent } from 'react'
import { Modal } from '../Modal'
import { FormField } from '../FormField'
import { Input } from '../Input'
import { Select } from '../Select'
import { Btn } from '../Btn'
import { createVaccination } from '../../api/vaccinations'
import { ApiError } from '../../lib/api'
import { todayApiDate } from '../../utils/helpers'
import type { ApiOwner, ApiPet, ApiProduct, ApiVeterinarian, ApiVaccination } from '../../types'

export function RegistrarVacunaModal({
  pets,
  owners,
  veterinarians,
  products,
  stockByProductId,
  defaultPetId,
  onClose,
  onSaved,
}: {
  pets: ApiPet[]
  owners: ApiOwner[]
  veterinarians: ApiVeterinarian[]
  products: ApiProduct[]
  stockByProductId: Map<number, number>
  defaultPetId?: number
  onClose: () => void
  onSaved: (vaccination: ApiVaccination) => void
}) {
  const [petId, setPetId] = useState(defaultPetId ? String(defaultPetId) : '')
  const [vaccineName, setVaccineName] = useState('')
  const [productId, setProductId] = useState('')
  const [appliedDate, setAppliedDate] = useState(todayApiDate())
  const [nextDoseDate, setNextDoseDate] = useState('')
  const [veterinarianId, setVeterinarianId] = useState('')
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
      setError('Elegí la mascota vacunada.')
      return
    }
    if (vaccineName.trim().length < 1) {
      setError('Indicá el nombre de la vacuna.')
      return
    }

    setLoading(true)
    try {
      const saved = await createVaccination({
        petId: Number(petId),
        vaccineName: vaccineName.trim(),
        productId: productId ? Number(productId) : undefined,
        appliedDate: appliedDate || undefined,
        nextDoseDate: nextDoseDate || undefined,
        veterinarianId: veterinarianId ? Number(veterinarianId) : undefined,
        notes: notes || undefined,
      })
      onSaved(saved)
    } catch (err) {
      // El backend devuelve "Stock insuficiente para la operación" (409) si el
      // producto asociado lleva stock y no queda unidad para descontar.
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar la vacuna.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Registrar vacuna" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>
        )}

        <FormField label="Mascota">
          <Select value={petId} onChange={setPetId}>
            <option value="">— Elegí una mascota —</option>
            {pets.map(p => (
              <option key={p.id} value={String(p.id)}>
                {p.name} — {ownerById.get(p.ownerId)?.fullName ?? '—'}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Nombre de la vacuna">
          <Input placeholder="Ej. Antirrábica, Séxtuple (DHPPI+L)..." value={vaccineName} onChange={setVaccineName} />
        </FormField>

        <FormField label="Producto asociado (opcional)">
          <Select value={productId} onChange={setProductId}>
            <option value="">— Sin asociar —</option>
            {products.map(p => (
              <option key={p.id} value={String(p.id)}>
                {p.name}
                {p.trackStock ? ` (${stockByProductId.get(p.id) ?? 0} en stock)` : ''}
              </option>
            ))}
          </Select>
          <p className="text-xs text-slate-400 mt-1">
            Si el producto lleva control de stock, se descuenta 1 unidad al registrar la vacuna.
          </p>
        </FormField>

        <FormField label="Veterinario (opcional)">
          <Select value={veterinarianId} onChange={setVeterinarianId}>
            <option value="">— Sin especificar —</option>
            {veterinarians.map(v => (
              <option key={v.id} value={String(v.id)}>
                {v.fullName}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Fecha de aplicación">
            <Input type="date" value={appliedDate} onChange={setAppliedDate} />
          </FormField>
          <FormField label="Próxima dosis (opcional)">
            <Input type="date" value={nextDoseDate} onChange={setNextDoseDate} />
          </FormField>
        </div>

        <FormField label="Notas (opcional)">
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ej. primera dosis, reacción observada..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </FormField>

        <div className="flex gap-2 pt-2">
          <Btn type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Registrar vacuna'}
          </Btn>
          <Btn type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Btn>
        </div>
      </form>
    </Modal>
  )
}
