import { useEffect, useMemo, useState } from 'react'
import type { ApiConsultation, ApiOwner, ApiPet, ApiVeterinarian, PetSpecies } from '../types'
import { listPets } from '../api/pets'
import { listOwners } from '../api/owners'
import { listVeterinarians } from '../api/veterinarians'
import { listConsultations } from '../api/consultations'
import { ApiError } from '../lib/api'
import { formatApiDate } from '../utils/helpers'
import { Btn } from '../components/Btn'
import { Ico } from '../components/Ico'
import { SearchInput } from '../components/SearchInput'
import { EmptyState } from '../components/EmptyState'
import { Badge } from '../components/Badge'
import { NuevaConsultaModal } from '../components/modals/NuevaConsultaModal'

const SPECIES_LABELS: Record<PetSpecies, string> = {
  PERRO: 'Perro',
  GATO: 'Gato',
  AVE: 'Ave',
  ROEDOR: 'Roedor',
  REPTIL: 'Reptil',
  OTRO: 'Otro',
}

export function HistoriaScreen() {
  const [petSearch, setPetSearch] = useState('')
  const [selectedPetId, setSelectedPetId] = useState<number | ''>('')
  const [pets, setPets] = useState<ApiPet[]>([])
  const [owners, setOwners] = useState<ApiOwner[]>([])
  const [veterinarians, setVeterinarians] = useState<ApiVeterinarian[]>([])
  const [refLoading, setRefLoading] = useState(true)
  const [refError, setRefError] = useState<string | null>(null)

  const [records, setRecords] = useState<ApiConsultation[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)

  async function loadReference() {
    setRefLoading(true)
    setRefError(null)
    try {
      const [petsResult, ownersActive, ownersInactive, vetsResult] = await Promise.all([
        listPets({ active: true, limit: 200 }),
        listOwners({ active: true, limit: 200 }),
        listOwners({ active: false, limit: 200 }),
        listVeterinarians({ active: true, limit: 200 }),
      ])
      setPets(petsResult.data)
      setOwners([...ownersActive.data, ...ownersInactive.data])
      setVeterinarians(vetsResult.data)
    } catch (err) {
      setRefError(err instanceof ApiError ? err.message : 'No se pudieron cargar las mascotas.')
    } finally {
      setRefLoading(false)
    }
  }

  useEffect(() => {
    loadReference()
  }, [])

  async function loadRecords(petId: number) {
    setRecordsLoading(true)
    setRecordsError(null)
    try {
      const result = await listConsultations({ petId, limit: 100 })
      setRecords(result.data)
    } catch (err) {
      setRecordsError(err instanceof ApiError ? err.message : 'No se pudo cargar la historia clínica.')
    } finally {
      setRecordsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedPetId === '') {
      setRecords([])
      return
    }
    loadRecords(selectedPetId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPetId])

  const ownerById = useMemo(() => {
    const map = new Map<number, ApiOwner>()
    owners.forEach(o => map.set(o.id, o))
    return map
  }, [owners])

  const vetById = useMemo(() => {
    const map = new Map<number, ApiVeterinarian>()
    veterinarians.forEach(v => map.set(v.id, v))
    return map
  }, [veterinarians])

  const filteredPets = useMemo(() => {
    const q = petSearch.trim().toLowerCase()
    if (!q) return pets
    return pets.filter(p => p.name.toLowerCase().includes(q))
  }, [pets, petSearch])

  const pet = selectedPetId !== '' ? pets.find(p => p.id === selectedPetId) : undefined

  function handleSaved() {
    setShowModal(false)
    if (selectedPetId !== '') loadRecords(selectedPetId)
  }

  return (
    <div className="space-y-5">
      {/* Selector bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-52 max-w-sm space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
              Buscar y seleccionar mascota
            </label>
            <SearchInput value={petSearch} onChange={setPetSearch} placeholder="Buscar por nombre..." />
            <select
              value={selectedPetId}
              onChange={e => setSelectedPetId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-900 bg-white"
            >
              <option value="">— Elegir mascota —</option>
              {filteredPets.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({SPECIES_LABELS[p.species]} · {ownerById.get(p.ownerId)?.fullName ?? '—'})
                </option>
              ))}
            </select>
          </div>
          {pet && (
            <Btn onClick={() => setShowModal(true)}>
              <Ico name="plus" size={14} />
              Nueva consulta
            </Btn>
          )}
        </div>

        {/* Pet mini-card */}
        {pet && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-base flex-shrink-0">
              {pet.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <p className="text-sm font-semibold text-slate-800">{pet.name}</p>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                  {SPECIES_LABELS[pet.species]}
                  {pet.breed ? ` · ${pet.breed}` : ''}
                </span>
                <span className="text-xs text-slate-400">{ownerById.get(pet.ownerId)?.fullName ?? '—'}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {pet.weight ? `${pet.weight} kg` : 'Peso sin registrar'} ·{' '}
                {records.length} {records.length === 1 ? 'consulta registrada' : 'consultas registradas'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Content area */}
      {refLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState icon="clock" title="Cargando..." description="Buscando mascotas en la base de datos." />
        </div>
      ) : refError ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon="alert"
            title="No se pudo cargar"
            description={refError}
            action={
              <Btn variant="outline" size="sm" onClick={loadReference}>
                Reintentar
              </Btn>
            }
          />
        </div>
      ) : !pet ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon="file"
            title="Seleccioná una mascota"
            description="Elegí una mascota del selector para ver su historia clínica completa."
          />
        </div>
      ) : recordsLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState icon="clock" title="Cargando..." description="Buscando la historia clínica de la mascota." />
        </div>
      ) : recordsError ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon="alert"
            title="No se pudo cargar"
            description={recordsError}
            action={
              <Btn variant="outline" size="sm" onClick={() => loadRecords(pet.id)}>
                Reintentar
              </Btn>
            }
          />
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon="file"
            title="Sin consultas registradas"
            description={`${pet.name} no tiene consultas en su historia clínica todavía.`}
            action={
              <Btn onClick={() => setShowModal(true)}>
                <Ico name="plus" size={14} />
                Registrar primera consulta
              </Btn>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r, i) => {
            const vet = r.veterinarianId ? vetById.get(r.veterinarianId) : undefined
            const isFirst = i === 0
            return (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${isFirst ? 'bg-teal-500' : 'bg-slate-300'}`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{r.reason ?? 'Consulta'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatApiDate(r.consultationDate)}
                        {vet ? ` · ${vet.fullName}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.weight !== null && (
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                        <Ico name="weight" size={13} className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700 tabular-nums">{r.weight} kg</span>
                      </div>
                    )}
                    {isFirst && <Badge status="Atendido" />}
                  </div>
                </div>
                <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                      Diagnóstico
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{r.diagnosis ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                      Tratamiento
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{r.treatment ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Notas</p>
                    <p className="text-sm text-slate-500 leading-relaxed">{r.notes ?? '—'}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && pet && (
        <NuevaConsultaModal petId={pet.id} petName={pet.name} onClose={() => setShowModal(false)} onSaved={handleSaved} />
      )}
    </div>
  )
}
