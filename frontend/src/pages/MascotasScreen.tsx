import { useEffect, useMemo, useRef, useState } from 'react'
import type { ApiConsultation, ApiOwner, ApiPet, ApiPetDetail, ApiVeterinarian, PetAge, PetSpecies } from '../types'
import { listPets, deletePet, getPet } from '../api/pets'
import { listOwners } from '../api/owners'
import { listVeterinarians } from '../api/veterinarians'
import { listConsultations } from '../api/consultations'
import { ApiError } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import { formatApiDate } from '../utils/helpers'
import { Btn } from '../components/Btn'
import { Ico } from '../components/Ico'
import { SearchInput } from '../components/SearchInput'
import { EmptyState } from '../components/EmptyState'
import { Badge } from '../components/Badge'
import { NuevaMascotaModal } from '../components/modals/NuevaMascotaModal'
import { NuevaConsultaModal } from '../components/modals/NuevaConsultaModal'

type ModalState = { mode: 'create' } | { mode: 'edit'; pet: ApiPet } | null

const SPECIES_LABELS: Record<PetSpecies, string> = {
  PERRO: 'Perro',
  GATO: 'Gato',
  AVE: 'Ave',
  ROEDOR: 'Roedor',
  REPTIL: 'Reptil',
  OTRO: 'Otro',
}

const SPECIES_COLORS: Record<PetSpecies, string> = {
  PERRO: 'bg-amber-100 text-amber-700',
  GATO: 'bg-purple-100 text-purple-700',
  AVE: 'bg-sky-100 text-sky-700',
  ROEDOR: 'bg-pink-100 text-pink-700',
  REPTIL: 'bg-emerald-100 text-emerald-700',
  OTRO: 'bg-slate-100 text-slate-600',
}

function formatAge(age: PetAge | null): string {
  if (!age) return '—'
  if (age.years > 0) {
    return `${age.years} ${age.years === 1 ? 'año' : 'años'}${age.months > 0 ? ` ${age.months}m` : ''}`
  }
  return `${age.months} ${age.months === 1 ? 'mes' : 'meses'}`
}

export function MascotasScreen() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [search, setSearch] = useState('')
  const [species, setSpecies] = useState<PetSpecies | null>(null)
  const [pets, setPets] = useState<ApiPet[]>([])
  const [owners, setOwners] = useState<ApiOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null)
  const [detailReloadKey, setDetailReloadKey] = useState(0)
  const isFirstRun = useRef(true)
  const requestId = useRef(0)

  // El backend siempre filtra `active` (true por defecto, sin opción de
  // "todos"), así que para tener nombres de dueños de mascotas cuyo dueño fue
  // dado de baja igual se combinan activos e inactivos (mismo patrón que
  // VeterinariosScreen).
  async function load(currentSearch: string, currentSpecies: PetSpecies | null) {
    const thisRequest = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const [petsResult, ownersActive, ownersInactive] = await Promise.all([
        listPets({ search: currentSearch || undefined, species: currentSpecies ?? undefined, limit: 200 }),
        listOwners({ active: true, limit: 200 }),
        listOwners({ active: false, limit: 200 }),
      ])
      if (thisRequest !== requestId.current) return
      setPets(petsResult.data)
      setOwners([...ownersActive.data, ...ownersInactive.data])
    } catch (err) {
      if (thisRequest !== requestId.current) return
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar la lista de mascotas.')
    } finally {
      if (thisRequest === requestId.current) setLoading(false)
    }
  }

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      load(search, species)
      return
    }
    const timer = setTimeout(() => load(search, species), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, species])

  const ownerById = useMemo(() => {
    const map = new Map<number, ApiOwner>()
    owners.forEach(o => map.set(o.id, o))
    return map
  }, [owners])

  async function handleDelete(pet: ApiPet) {
    if (!window.confirm(`¿Dar de baja a "${pet.name}"? No podrá revertirse desde acá.`)) return
    setActionError(null)
    try {
      await deletePet(pet.id)
      await load(search, species)
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'No se pudo dar de baja la mascota.')
    }
  }

  function openModal(state: ModalState) {
    setActionError(null)
    setModal(state)
  }

  function handleSaved() {
    setModal(null)
    load(search, species)
    setDetailReloadKey(k => k + 1)
  }

  const editModal =
    modal?.mode === 'create' ? (
      <NuevaMascotaModal owners={owners.filter(o => o.active)} onClose={() => setModal(null)} onSaved={handleSaved} />
    ) : modal?.mode === 'edit' ? (
      <NuevaMascotaModal pet={modal.pet} owners={owners} onClose={() => setModal(null)} onSaved={handleSaved} />
    ) : null

  if (selectedPetId !== null) {
    return (
      <>
        <PetDetail
          key={detailReloadKey}
          petId={selectedPetId}
          onBack={() => setSelectedPetId(null)}
          onEdit={pet => openModal({ mode: 'edit', pet })}
        />
        {editModal}
      </>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-52 max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre..." />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSpecies(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              species === null ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas
          </button>
          {(Object.keys(SPECIES_LABELS) as PetSpecies[]).map(s => (
            <button
              key={s}
              onClick={() => setSpecies(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                species === s ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {SPECIES_LABELS[s]}
            </button>
          ))}
        </div>
        <Btn size="sm" onClick={() => openModal({ mode: 'create' })}>
          <Ico name="plus" size={13} />
          Nueva mascota
        </Btn>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
          {actionError}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Mascota', 'Especie', 'Raza', 'Dueño', 'Edad', 'Peso', ''].map(h => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider first:rounded-tl-xl"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState icon="clock" title="Cargando..." description="Buscando mascotas en la base de datos." />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon="alert"
                    title="No se pudo cargar"
                    description={error}
                    action={
                      <Btn variant="outline" size="sm" onClick={() => load(search, species)}>
                        Reintentar
                      </Btn>
                    }
                  />
                </td>
              </tr>
            ) : pets.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState title="Sin resultados" description="No hay mascotas que coincidan con la búsqueda." />
                </td>
              </tr>
            ) : (
              pets.map(p => {
                const owner = ownerById.get(p.ownerId)
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-teal-50/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedPetId(p.id)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm flex-shrink-0">
                          {p.name[0]}
                        </div>
                        <span className="font-medium text-slate-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SPECIES_COLORS[p.species]}`}>
                        {SPECIES_LABELS[p.species]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{p.breed ?? '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600">{owner?.fullName ?? '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 tabular-nums">{formatAge(p.age)}</td>
                    <td className="px-5 py-3.5 text-slate-600 tabular-nums">{p.weight ? `${p.weight} kg` : '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <Btn variant="ghost" size="sm" onClick={() => openModal({ mode: 'edit', pet: p })}>
                          <Ico name="edit" size={13} />
                        </Btn>
                        {isAdmin && (
                          <Btn variant="danger" size="sm" onClick={() => handleDelete(p)}>
                            <Ico name="x" size={13} />
                          </Btn>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {!loading && !error && <p className="text-xs text-slate-400">{pets.length} mascotas registradas</p>}

      {editModal}
    </div>
  )
}

function PetDetail({
  petId,
  onBack,
  onEdit,
}: {
  petId: number
  onBack: () => void
  onEdit: (pet: ApiPet) => void
}) {
  const [pet, setPet] = useState<ApiPetDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [consultations, setConsultations] = useState<ApiConsultation[]>([])
  const [veterinarians, setVeterinarians] = useState<ApiVeterinarian[]>([])
  const [consultationsLoading, setConsultationsLoading] = useState(true)
  const [consultationsError, setConsultationsError] = useState<string | null>(null)
  const [showConsultaModal, setShowConsultaModal] = useState(false)

  function load() {
    setLoading(true)
    setError(null)
    getPet(petId)
      .then(setPet)
      .catch(err => setError(err instanceof ApiError ? err.message : 'No se pudo cargar la ficha de la mascota.'))
      .finally(() => setLoading(false))
  }

  async function loadConsultations() {
    setConsultationsLoading(true)
    setConsultationsError(null)
    try {
      const [consultationsResult, vetsResult] = await Promise.all([
        listConsultations({ petId, limit: 100 }),
        listVeterinarians({ active: true, limit: 200 }),
      ])
      setConsultations(consultationsResult.data)
      setVeterinarians(vetsResult.data)
    } catch (err) {
      setConsultationsError(
        err instanceof ApiError ? err.message : 'No se pudo cargar la historia clínica.',
      )
    } finally {
      setConsultationsLoading(false)
    }
  }

  useEffect(load, [petId])
  useEffect(() => {
    loadConsultations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId])

  const vetById = useMemo(() => {
    const map = new Map<number, ApiVeterinarian>()
    veterinarians.forEach(v => map.set(v.id, v))
    return map
  }, [veterinarians])

  function handleConsultaSaved() {
    setShowConsultaModal(false)
    loadConsultations()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors border border-slate-200 bg-white"
        >
          <Ico name="arrowLeft" size={16} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">{pet?.name ?? 'Mascota'}</h2>
            {pet && (
              <>
                <span className="text-sm text-slate-400">·</span>
                <span className="text-sm text-slate-500">
                  {SPECIES_LABELS[pet.species]}
                  {pet.breed ? ` · ${pet.breed}` : ''}
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-slate-400">Historia clínica completa</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState icon="clock" title="Cargando..." description="Buscando la ficha de la mascota." />
        </div>
      ) : error || !pet ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon="alert"
            title="No se pudo cargar"
            description={error ?? 'Mascota no encontrada.'}
            action={
              <Btn variant="outline" size="sm" onClick={load}>
                Reintentar
              </Btn>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center text-2xl font-bold text-teal-600 flex-shrink-0">
                {pet.name[0]}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{pet.name}</h3>
                <p className="text-sm text-slate-500">
                  {SPECIES_LABELS[pet.species]}
                  {pet.breed ? ` · ${pet.breed}` : ''}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-slate-100">
              {(
                [
                  ['Dueño', pet.owner.fullName],
                  ['Teléfono del dueño', pet.owner.phone ?? '—'],
                  ['Edad', formatAge(pet.age)],
                  ['Sexo', pet.sex ? { MACHO: 'Macho', HEMBRA: 'Hembra', DESCONOCIDO: 'Desconocido' }[pet.sex] : '—'],
                  ['Peso', pet.weight ? `${pet.weight} kg` : '—'],
                  ['Color / pelaje', pet.color ?? '—'],
                  ['Registrado', formatApiDate(pet.creationDate)],
                ] as [string, string][]
              ).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-2 text-sm py-0.5">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-slate-800 font-medium text-right">{value}</span>
                </div>
              ))}
              {pet.notes && (
                <div className="pt-2 mt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-1">Notas</p>
                  <p className="text-sm text-slate-700">{pet.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-1 space-y-2">
              <Btn className="w-full justify-center">
                <Ico name="calendar" size={14} />
                Nuevo turno
              </Btn>
              <Btn variant="outline" className="w-full justify-center" onClick={() => onEdit(pet)}>
                <Ico name="edit" size={14} />
                Editar datos
              </Btn>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 xl:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-slate-900">Historia clínica</h3>
              <Btn size="sm" onClick={() => setShowConsultaModal(true)}>
                <Ico name="plus" size={13} />
                Nueva entrada
              </Btn>
            </div>
            {consultationsLoading ? (
              <EmptyState icon="clock" title="Cargando..." description="Buscando la historia clínica de la mascota." />
            ) : consultationsError ? (
              <EmptyState
                icon="alert"
                title="No se pudo cargar"
                description={consultationsError}
                action={
                  <Btn variant="outline" size="sm" onClick={loadConsultations}>
                    Reintentar
                  </Btn>
                }
              />
            ) : consultations.length === 0 ? (
              <EmptyState
                icon="file"
                title="Sin consultas registradas"
                description={`${pet.name} no tiene consultas en su historia clínica todavía.`}
              />
            ) : (
              <div className="space-y-3">
                {consultations.map((c, i) => {
                  const vet = c.veterinarianId ? vetById.get(c.veterinarianId) : undefined
                  return (
                    <div key={c.id} className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap bg-slate-50/50">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-teal-500' : 'bg-slate-300'}`} />
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{c.reason ?? 'Consulta'}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {formatApiDate(c.consultationDate)}
                              {vet ? ` · ${vet.fullName}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {c.weight !== null && (
                            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                              <Ico name="weight" size={12} className="text-slate-400" />
                              <span className="text-xs font-semibold text-slate-700 tabular-nums">{c.weight} kg</span>
                            </div>
                          )}
                          {i === 0 && <Badge status="Atendido" />}
                        </div>
                      </div>
                      <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Diagnóstico</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{c.diagnosis ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Tratamiento</p>
                          <p className="text-sm text-slate-700 leading-relaxed">{c.treatment ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Notas</p>
                          <p className="text-sm text-slate-500 leading-relaxed">{c.notes ?? '—'}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden xl:col-span-3">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ico name="syringe" size={15} className="text-teal-600" />
                <h3 className="text-sm font-semibold text-slate-900">Carnet de vacunación</h3>
              </div>
              <Btn size="sm" disabled>
                <Ico name="plus" size={13} />
                Registrar vacuna
              </Btn>
            </div>
            <div className="p-5">
              <EmptyState
                icon="syringe"
                title="Próximamente"
                description="El carnet de vacunación se conecta a la API en la pantalla de Vacunas."
              />
            </div>
          </div>
        </div>
      )}

      {showConsultaModal && pet && (
        <NuevaConsultaModal
          petId={pet.id}
          petName={pet.name}
          onClose={() => setShowConsultaModal(false)}
          onSaved={handleConsultaSaved}
        />
      )}
    </div>
  )
}
