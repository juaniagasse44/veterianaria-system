import { useEffect, useMemo, useState } from 'react'
import type { ApiOwner, ApiPet, ApiProduct, ApiStockLevel, ApiVaccination, ApiVeterinarian, PetSpecies } from '../types'
import { listPets } from '../api/pets'
import { listOwners } from '../api/owners'
import { listVeterinarians } from '../api/veterinarians'
import { listProducts } from '../api/products'
import { listStockLevels } from '../api/stock'
import { listUpcomingVaccinations, listVaccinations } from '../api/vaccinations'
import { ApiError } from '../lib/api'
import { formatDate, vaccDaysLeftFrom, vaccineStatusFrom } from '../utils/helpers'
import { Btn } from '../components/Btn'
import { Ico } from '../components/Ico'
import { SearchInput } from '../components/SearchInput'
import { EmptyState } from '../components/EmptyState'
import { Badge } from '../components/Badge'
import { RegistrarVacunaModal } from '../components/modals/RegistrarVacunaModal'

const SPECIES_LABELS: Record<PetSpecies, string> = {
  PERRO: 'Perro',
  GATO: 'Gato',
  AVE: 'Ave',
  ROEDOR: 'Roedor',
  REPTIL: 'Reptil',
  OTRO: 'Otro',
}

const UPCOMING_DAYS = 90

export function VacunasScreen() {
  const [tab, setTab] = useState<'carnet' | 'proximas'>('proximas')

  // Datos de referencia (mascotas/dueños/veterinarios/productos/stock)
  const [pets, setPets] = useState<ApiPet[]>([])
  const [owners, setOwners] = useState<ApiOwner[]>([])
  const [veterinarians, setVeterinarians] = useState<ApiVeterinarian[]>([])
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [stockLevels, setStockLevels] = useState<ApiStockLevel[]>([])
  const [refLoading, setRefLoading] = useState(true)
  const [refError, setRefError] = useState<string | null>(null)

  // Tab "Próximas a vencer"
  const [upcoming, setUpcoming] = useState<ApiVaccination[]>([])
  const [upcomingLoading, setUpcomingLoading] = useState(true)
  const [upcomingError, setUpcomingError] = useState<string | null>(null)

  // Tab "Carnet por mascota"
  const [petSearch, setPetSearch] = useState('')
  const [selectedPetId, setSelectedPetId] = useState<number | ''>('')
  const [carnet, setCarnet] = useState<ApiVaccination[]>([])
  const [carnetLoading, setCarnetLoading] = useState(false)
  const [carnetError, setCarnetError] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)

  async function loadReference() {
    setRefLoading(true)
    setRefError(null)
    try {
      const [petsResult, ownersActive, ownersInactive, vetsResult, productsResult, stockResult] = await Promise.all([
        listPets({ active: true, limit: 200 }),
        listOwners({ active: true, limit: 200 }),
        listOwners({ active: false, limit: 200 }),
        listVeterinarians({ active: true, limit: 200 }),
        listProducts({ active: true, limit: 200 }),
        listStockLevels(),
      ])
      setPets(petsResult.data)
      setOwners([...ownersActive.data, ...ownersInactive.data])
      setVeterinarians(vetsResult.data)
      setProducts(productsResult.data)
      setStockLevels(stockResult)
    } catch (err) {
      setRefError(err instanceof ApiError ? err.message : 'No se pudieron cargar los datos base.')
    } finally {
      setRefLoading(false)
    }
  }

  async function loadUpcoming() {
    setUpcomingLoading(true)
    setUpcomingError(null)
    try {
      setUpcoming(await listUpcomingVaccinations({ days: UPCOMING_DAYS }))
    } catch (err) {
      setUpcomingError(err instanceof ApiError ? err.message : 'No se pudieron cargar las vacunas próximas a vencer.')
    } finally {
      setUpcomingLoading(false)
    }
  }

  useEffect(() => {
    loadReference()
    loadUpcoming()
  }, [])

  async function loadCarnet(petId: number) {
    setCarnetLoading(true)
    setCarnetError(null)
    try {
      const result = await listVaccinations({ petId, limit: 100 })
      setCarnet(result.data)
    } catch (err) {
      setCarnetError(err instanceof ApiError ? err.message : 'No se pudo cargar el carnet de vacunación.')
    } finally {
      setCarnetLoading(false)
    }
  }

  useEffect(() => {
    if (selectedPetId === '') {
      setCarnet([])
      return
    }
    loadCarnet(selectedPetId)
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

  const stockByProductId = useMemo(() => {
    const map = new Map<number, number>()
    stockLevels.forEach(s => map.set(s.productId, s.quantity))
    return map
  }, [stockLevels])

  const filteredPets = useMemo(() => {
    const q = petSearch.trim().toLowerCase()
    if (!q) return pets
    return pets.filter(p => p.name.toLowerCase().includes(q))
  }, [pets, petSearch])

  const pet = selectedPetId !== '' ? pets.find(p => p.id === selectedPetId) : undefined

  function handleSaved() {
    setShowModal(false)
    loadUpcoming()
    if (selectedPetId !== '') loadCarnet(selectedPetId)
  }

  if (refLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <EmptyState icon="clock" title="Cargando..." description="Buscando los datos de vacunación." />
      </div>
    )
  }
  if (refError) {
    return (
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
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex bg-white border border-slate-200 rounded-lg p-0.5">
          {(
            [
              ['proximas', 'Próximas a vencer'],
              ['carnet', 'Carnet por mascota'],
            ] as [typeof tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === key ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {label}
              {key === 'proximas' && upcoming.length > 0 && (
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    tab === key ? 'bg-teal-500 text-white' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {upcoming.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <Btn onClick={() => setShowModal(true)}>
          <Ico name="plus" size={14} />
          Registrar vacuna
        </Btn>
      </div>

      {/* Proximas a vencer tab */}
      {tab === 'proximas' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">Vacunas a vencer — próximos {UPCOMING_DAYS} días</p>
            <p className="text-xs text-slate-400 mt-0.5">Mascotas que requieren contacto o refuerzo próximamente</p>
          </div>
          {upcomingLoading ? (
            <EmptyState icon="clock" title="Cargando..." description="Buscando vacunas próximas a vencer." />
          ) : upcomingError ? (
            <EmptyState
              icon="alert"
              title="No se pudo cargar"
              description={upcomingError}
              action={
                <Btn variant="outline" size="sm" onClick={loadUpcoming}>
                  Reintentar
                </Btn>
              }
            />
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon="check"
              title="Todo al día"
              description={`No hay vacunas próximas a vencer en los próximos ${UPCOMING_DAYS} días.`}
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Mascota', 'Dueño', 'Vacuna', 'Vence', 'Días restantes', 'Estado'].map(h => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcoming.map(v => {
                  const owner = ownerById.get(v.pet.ownerId)
                  const days = vaccDaysLeftFrom(v.nextDoseDate!)
                  const vs = vaccineStatusFrom(v.nextDoseDate!)

                  let daysLabel = ''
                  let daysClass = ''
                  if (days < 0) {
                    daysLabel = `Vencida hace ${Math.abs(days)} días`
                    daysClass = 'text-red-600 font-semibold'
                  } else if (days === 0) {
                    daysLabel = 'Vence hoy'
                    daysClass = 'text-red-600 font-semibold'
                  } else {
                    daysLabel = `${days} días`
                    daysClass = days <= 14 ? 'text-amber-600 font-semibold' : 'text-slate-700'
                  }

                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        vs === 'Vencida' ? 'bg-red-50/30' : vs === 'Por vencer' ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-xs flex-shrink-0">
                            {v.pet.name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{v.pet.name}</p>
                            <p className="text-xs text-slate-400">
                              {SPECIES_LABELS[v.pet.species]}
                              {v.pet.breed ? ` · ${v.pet.breed}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{owner?.fullName ?? '—'}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{v.vaccineName}</td>
                      <td className="px-5 py-3.5 text-slate-600 tabular-nums">{formatDate(v.nextDoseDate!)}</td>
                      <td className={`px-5 py-3.5 tabular-nums ${daysClass}`}>{daysLabel}</td>
                      <td className="px-5 py-3.5">
                        <Badge status={vs} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          {!upcomingLoading && !upcomingError && (
            <div className="px-5 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">{upcoming.length} vacunas requieren atención</p>
            </div>
          )}
        </div>
      )}

      {/* Carnet tab */}
      {tab === 'carnet' && (
        <div className="space-y-4">
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
                      {p.name} — {ownerById.get(p.ownerId)?.fullName ?? '—'}
                    </option>
                  ))}
                </select>
              </div>
              {pet && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm">
                    {pet.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{pet.name}</p>
                    <p className="text-xs text-slate-400">
                      {SPECIES_LABELS[pet.species]}
                      {pet.breed ? ` · ${pet.breed}` : ''} · {ownerById.get(pet.ownerId)?.fullName ?? '—'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!pet ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <EmptyState
                icon="syringe"
                title="Seleccioná una mascota"
                description="Elegí una mascota del selector para ver su carnet de vacunación."
              />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Ico name="syringe" size={15} className="text-teal-600" />
                <h3 className="text-sm font-semibold text-slate-900">Carnet de vacunación — {pet.name}</h3>
              </div>
              {carnetLoading ? (
                <EmptyState icon="clock" title="Cargando..." description="Buscando el carnet de vacunación." />
              ) : carnetError ? (
                <EmptyState
                  icon="alert"
                  title="No se pudo cargar"
                  description={carnetError}
                  action={
                    <Btn variant="outline" size="sm" onClick={() => loadCarnet(pet.id)}>
                      Reintentar
                    </Btn>
                  }
                />
              ) : carnet.length === 0 ? (
                <EmptyState
                  icon="syringe"
                  title="Sin vacunas registradas"
                  description="Esta mascota no tiene vacunas en su carnet todavía."
                  action={
                    <Btn onClick={() => setShowModal(true)}>
                      <Ico name="plus" size={14} />
                      Registrar primera vacuna
                    </Btn>
                  }
                />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Vacuna', 'Fecha de aplicación', 'Próxima dosis', 'Días restantes', 'Veterinario', 'Estado'].map(
                        h => (
                          <th
                            key={h}
                            className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {carnet.map(v => {
                      const vet = v.veterinarianId ? vetById.get(v.veterinarianId) : undefined
                      const vs = v.nextDoseDate ? vaccineStatusFrom(v.nextDoseDate) : null
                      const days = v.nextDoseDate ? vaccDaysLeftFrom(v.nextDoseDate) : null
                      let daysLabel = '—'
                      let daysClass = 'text-slate-400'
                      if (days !== null) {
                        if (days < 0) {
                          daysLabel = `Hace ${Math.abs(days)} días`
                          daysClass = 'text-red-600 font-semibold'
                        } else if (days === 0) {
                          daysLabel = 'Hoy'
                          daysClass = 'text-red-600 font-semibold'
                        } else {
                          daysLabel = `${days} días`
                          daysClass = days <= 30 ? 'text-amber-600 font-semibold' : 'text-slate-600'
                        }
                      }

                      return (
                        <tr
                          key={v.id}
                          className={`hover:bg-slate-50 transition-colors ${vs === 'Vencida' ? 'bg-red-50/30' : ''}`}
                        >
                          <td className="px-5 py-3.5 font-medium text-slate-800">{v.vaccineName}</td>
                          <td className="px-5 py-3.5 text-slate-600 tabular-nums">{formatDate(v.appliedDate)}</td>
                          <td className="px-5 py-3.5 text-slate-600 tabular-nums">
                            {v.nextDoseDate ? formatDate(v.nextDoseDate) : '—'}
                          </td>
                          <td className={`px-5 py-3.5 tabular-nums ${daysClass}`}>{daysLabel}</td>
                          <td className="px-5 py-3.5 text-slate-600">{vet?.fullName ?? '—'}</td>
                          <td className="px-5 py-3.5">{vs ? <Badge status={vs} /> : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <RegistrarVacunaModal
          pets={pets}
          owners={owners}
          veterinarians={veterinarians}
          products={products}
          stockByProductId={stockByProductId}
          defaultPetId={pet?.id}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
