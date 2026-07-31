import { useMemo, useState, type FormEvent } from 'react'
import { Modal } from '../Modal'
import { FormField } from '../FormField'
import { Input } from '../Input'
import { Select } from '../Select'
import { Btn } from '../Btn'
import { createPet, updatePet } from '../../api/pets'
import { ApiError } from '../../lib/api'
import type { ApiOwner, ApiPet, PetSex, PetSpecies } from '../../types'

const SPECIES_LABELS: Record<PetSpecies, string> = {
  PERRO: 'Perro',
  GATO: 'Gato',
  AVE: 'Ave',
  ROEDOR: 'Roedor',
  REPTIL: 'Reptil',
  OTRO: 'Otro',
}

const SEX_LABELS: Record<PetSex, string> = {
  MACHO: 'Macho',
  HEMBRA: 'Hembra',
  DESCONOCIDO: 'Desconocido',
}

export function NuevaMascotaModal({
  pet,
  owners,
  defaultOwnerId,
  onClose,
  onSaved,
}: {
  pet?: ApiPet
  owners: ApiOwner[]
  defaultOwnerId?: number
  onClose: () => void
  onSaved: (pet: ApiPet) => void
}) {
  const isEdit = !!pet
  const currentOwner = isEdit ? owners.find(o => o.id === pet.ownerId) : undefined

  const [ownerSearch, setOwnerSearch] = useState('')
  const [ownerId, setOwnerId] = useState(pet ? String(pet.ownerId) : defaultOwnerId ? String(defaultOwnerId) : '')
  const [name, setName] = useState(pet?.name ?? '')
  const [species, setSpecies] = useState<PetSpecies>(pet?.species ?? 'PERRO')
  const [breed, setBreed] = useState(pet?.breed ?? '')
  const [sex, setSex] = useState<PetSex | ''>(pet?.sex ?? '')
  const [birthDate, setBirthDate] = useState(pet?.birthDate ?? '')
  const [weight, setWeight] = useState(pet?.weight ? String(pet.weight) : '')
  const [color, setColor] = useState(pet?.color ?? '')
  const [notes, setNotes] = useState(pet?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredOwners = useMemo(() => {
    const q = ownerSearch.trim().toLowerCase()
    if (!q) return owners
    return owners.filter(
      o => o.fullName.toLowerCase().includes(q) || (o.document?.toLowerCase().includes(q) ?? false),
    )
  }, [owners, ownerSearch])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!isEdit && !ownerId) {
      setError('Elegí el dueño de la mascota.')
      return
    }
    if (name.trim().length < 1) {
      setError('El nombre de la mascota es obligatorio.')
      return
    }

    setLoading(true)
    try {
      const shared = {
        name,
        species,
        breed: breed || undefined,
        sex: sex || undefined,
        birthDate: birthDate || undefined,
        weight: weight ? Number(weight) : undefined,
        color: color || undefined,
        notes: notes || undefined,
      }
      const saved = isEdit ? await updatePet(pet.id, shared) : await createPet({ ownerId: Number(ownerId), ...shared })
      onSaved(saved)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la mascota.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Editar mascota' : 'Nueva mascota'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {isEdit ? (
          <FormField label="Dueño">
            <p className="text-sm text-slate-600 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
              {currentOwner?.fullName ?? '—'}
            </p>
            <p className="text-xs text-slate-400">El dueño no se puede modificar desde acá.</p>
          </FormField>
        ) : (
          <FormField label="Dueño">
            <div className="space-y-2">
              <Input placeholder="Buscar dueño por nombre o DNI..." value={ownerSearch} onChange={setOwnerSearch} />
              <Select value={ownerId} onChange={setOwnerId}>
                <option value="">— Elegí un dueño —</option>
                {filteredOwners.map(o => (
                  <option key={o.id} value={String(o.id)}>
                    {o.fullName}
                    {o.document ? ` — DNI ${o.document}` : ''}
                  </option>
                ))}
              </Select>
              {filteredOwners.length === 0 && (
                <p className="text-xs text-slate-400">No hay dueños que coincidan con la búsqueda.</p>
              )}
            </div>
          </FormField>
        )}

        <FormField label="Nombre de la mascota">
          <Input placeholder="Ej. Toby" value={name} onChange={setName} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Especie">
            <Select value={species} onChange={v => setSpecies(v as PetSpecies)}>
              {(Object.keys(SPECIES_LABELS) as PetSpecies[]).map(s => (
                <option key={s} value={s}>
                  {SPECIES_LABELS[s]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Raza">
            <Input placeholder="Ej. Labrador" value={breed} onChange={setBreed} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Sexo">
            <Select value={sex} onChange={v => setSex(v as PetSex | '')}>
              <option value="">— Sin especificar —</option>
              {(Object.keys(SEX_LABELS) as PetSex[]).map(s => (
                <option key={s} value={s}>
                  {SEX_LABELS[s]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Fecha de nacimiento">
            <Input type="date" value={birthDate} onChange={setBirthDate} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Peso (kg)">
            <Input type="number" placeholder="0" value={weight} onChange={setWeight} />
          </FormField>
          <FormField label="Color / pelaje">
            <Input placeholder="Ej. Marrón" value={color} onChange={setColor} />
          </FormField>
        </div>

        <FormField label="Notas (opcional)">
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ej. alergias, condiciones preexistentes..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </FormField>

        <div className="flex gap-2 pt-2">
          <Btn type="submit" disabled={loading}>
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar mascota'}
          </Btn>
          <Btn type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Btn>
        </div>
      </form>
    </Modal>
  )
}
