import { useState, useMemo } from 'react'
import type { Pet } from '../types'
import { PETS, MED_RECORDS, VACCINES } from '../data/mockData'
import { getOwner, getVet, formatDate, vaccineStatus } from '../utils/helpers'
import { Btn } from '../components/Btn'
import { Ico } from '../components/Ico'
import { SearchInput } from '../components/SearchInput'
import { EmptyState } from '../components/EmptyState'
import { Badge } from '../components/Badge'

export function MascotasScreen() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Pet | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return PETS.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.species.toLowerCase().includes(q) ||
        p.breed.toLowerCase().includes(q) ||
        (getOwner(p.ownerId)?.name.toLowerCase().includes(q) ?? false),
    )
  }, [search])

  if (selected) {
    return <PetDetail pet={selected} onBack={() => setSelected(null)} />
  }

  const speciesColor: Record<string, string> = {
    Perro: 'bg-amber-100 text-amber-700',
    Gato: 'bg-purple-100 text-purple-700',
    Conejo: 'bg-pink-100 text-pink-700',
    Ave: 'bg-sky-100 text-sky-700',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-52 max-w-sm">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, especie, raza o dueño..."
          />
        </div>
        <Btn variant="outline" size="sm">
          <Ico name="filter" size={13} />
          Filtrar
        </Btn>
        <Btn size="sm">
          <Ico name="plus" size={13} />
          Nueva mascota
        </Btn>
      </div>

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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    title="Sin resultados"
                    description="No hay mascotas que coincidan con la búsqueda."
                  />
                </td>
              </tr>
            ) : (
              filtered.map(p => {
                const owner = getOwner(p.ownerId)
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-teal-50/30 cursor-pointer transition-colors"
                    onClick={() => setSelected(p)}
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
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${speciesColor[p.species] ?? 'bg-slate-100 text-slate-600'}`}
                      >
                        {p.species}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{p.breed}</td>
                    <td className="px-5 py-3.5 text-slate-600">{owner?.name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 tabular-nums">
                      {p.age} {p.age === 1 ? 'año' : 'años'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 tabular-nums">{p.weight} kg</td>
                    <td className="px-5 py-3.5">
                      <Ico name="chevRight" size={15} className="text-slate-300" />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">{filtered.length} mascotas registradas</p>
    </div>
  )
}

function PetDetail({ pet, onBack }: { pet: Pet; onBack: () => void }) {
  const owner = getOwner(pet.ownerId)
  const records = MED_RECORDS.filter(r => r.petId === pet.id).sort((a, b) =>
    b.date.localeCompare(a.date),
  )
  const vaccs = VACCINES.filter(v => v.petId === pet.id).sort((a, b) =>
    b.date.localeCompare(a.date),
  )

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
            <h2 className="text-base font-semibold text-slate-900">{pet.name}</h2>
            <span className="text-sm text-slate-400">·</span>
            <span className="text-sm text-slate-500">{pet.species} · {pet.breed}</span>
          </div>
          <p className="text-xs text-slate-400">Historia clínica completa</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Pet card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center text-2xl font-bold text-teal-600 flex-shrink-0">
              {pet.name[0]}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-900 leading-tight">{pet.name}</h3>
              <p className="text-sm text-slate-500">{pet.species} · {pet.breed}</p>
              {pet.microchip && (
                <p className="text-xs text-slate-400 font-mono mt-1">{pet.microchip}</p>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-slate-100">
            {(
              [
                ['Dueño', owner?.name ?? '—'],
                ['Edad', `${pet.age} ${pet.age === 1 ? 'año' : 'años'}`],
                ['Peso', `${pet.weight} kg`],
                ['Color / pelaje', pet.color],
                ['Registrado', formatDate(pet.since)],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-2 text-sm py-0.5">
                <span className="text-slate-400">{label}</span>
                <span className="text-slate-800 font-medium text-right">{value}</span>
              </div>
            ))}
          </div>

          <div className="pt-1 space-y-2">
            <Btn className="w-full justify-center">
              <Ico name="calendar" size={14} />
              Nuevo turno
            </Btn>
            <Btn variant="outline" className="w-full justify-center">
              <Ico name="edit" size={14} />
              Editar datos
            </Btn>
          </div>
        </div>

        {/* Medical history timeline */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-900">Historia clínica</h3>
            <Btn size="sm">
              <Ico name="plus" size={13} />
              Nueva entrada
            </Btn>
          </div>

          {records.length === 0 ? (
            <EmptyState
              icon="file"
              title="Sin registros"
              description="No hay consultas registradas para esta mascota."
            />
          ) : (
            <div className="relative">
              <div className="absolute left-3.5 top-3 bottom-3 w-px bg-slate-200" />
              <div className="space-y-6">
                {records.map(r => {
                  const vet = getVet(r.vetId)
                  return (
                    <div key={r.id} className="flex gap-5 relative">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white border-2 border-teal-500 flex items-center justify-center z-10 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-teal-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="text-sm font-semibold text-slate-800 leading-snug">{r.diagnosis}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {formatDate(r.date)} · {vet?.name}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 bg-slate-50 rounded-lg px-3 py-2.5 space-y-1">
                          <p className="text-xs text-slate-700">
                            <span className="font-semibold">Tratamiento:</span> {r.treatment}
                          </p>
                          <p className="text-xs text-slate-500">{r.notes}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Vaccine card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden xl:col-span-3">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ico name="syringe" size={15} className="text-teal-600" />
              <h3 className="text-sm font-semibold text-slate-900">Carnet de vacunación</h3>
            </div>
            <Btn size="sm">
              <Ico name="plus" size={13} />
              Registrar vacuna
            </Btn>
          </div>
          {vaccs.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon="syringe"
                title="Sin vacunas"
                description="No hay vacunas registradas para esta mascota."
              />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Vacuna', 'Fecha de aplicación', 'Próximo vencimiento', 'Lote', 'Veterinario', 'Estado'].map(
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
                {vaccs.map(v => {
                  const vet = getVet(v.vetId)
                  const vs = vaccineStatus(v.nextDue)
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-800">{v.name}</td>
                      <td className="px-5 py-3.5 text-slate-600 tabular-nums">{formatDate(v.date)}</td>
                      <td className="px-5 py-3.5 text-slate-600 tabular-nums">{formatDate(v.nextDue)}</td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{v.batch}</td>
                      <td className="px-5 py-3.5 text-slate-600">{vet?.name}</td>
                      <td className="px-5 py-3.5">
                        <Badge status={vs} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
