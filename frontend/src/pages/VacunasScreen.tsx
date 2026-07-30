import { useState, useMemo } from 'react'
import { PETS, VACCINES } from '../data/mockData'
import { getOwner, getPet, getVet, formatDate, vaccDaysLeft, vaccineStatus } from '../utils/helpers'
import { Btn } from '../components/Btn'
import { Ico } from '../components/Ico'
import { EmptyState } from '../components/EmptyState'
import { Badge } from '../components/Badge'
import { RegistrarVacunaModal } from '../components/modals/RegistrarVacunaModal'

export function VacunasScreen() {
  const [tab, setTab] = useState<'carnet' | 'proximas'>('proximas')
  const [selectedPetId, setSelectedPetId] = useState<number>(1)
  const [showModal, setShowModal] = useState(false)

  const pet = getPet(selectedPetId)
  const carnetVaccs = VACCINES.filter(v => v.petId === selectedPetId).sort((a, b) =>
    b.date.localeCompare(a.date),
  )

  const proximas = useMemo(() => {
    return VACCINES.filter(v => vaccDaysLeft(v.nextDue) <= 90)
      .sort((a, b) => a.nextDue.localeCompare(b.nextDue))
  }, [])

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
                tab === key
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {label}
              {key === 'proximas' && proximas.length > 0 && (
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    tab === key ? 'bg-teal-500 text-white' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {proximas.length}
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
            <p className="text-sm font-semibold text-slate-900">Vacunas a vencer — próximos 90 días</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Mascotas que requieren contacto o refuerzo próximamente
            </p>
          </div>
          {proximas.length === 0 ? (
            <EmptyState
              icon="check"
              title="Todo al día"
              description="No hay vacunas próximas a vencer en los próximos 90 días."
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Mascota', 'Dueño', 'Vacuna', 'Vence', 'Días restantes', 'Estado', ''].map(h => (
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
                {proximas.map(v => {
                  const p = getPet(v.petId)
                  const owner = p ? getOwner(p.ownerId) : undefined
                  const days = vaccDaysLeft(v.nextDue)
                  const vs = vaccineStatus(v.nextDue)

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
                      className={`hover:bg-slate-50 transition-colors ${vs === 'Vencida' ? 'bg-red-50/30' : vs === 'Por vencer' ? 'bg-amber-50/20' : ''}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-xs flex-shrink-0">
                            {p?.name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{p?.name}</p>
                            <p className="text-xs text-slate-400">{p?.species} · {p?.breed}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{owner?.name ?? '—'}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{v.name}</td>
                      <td className="px-5 py-3.5 text-slate-600 tabular-nums">{formatDate(v.nextDue)}</td>
                      <td className={`px-5 py-3.5 tabular-nums ${daysClass}`}>{daysLabel}</td>
                      <td className="px-5 py-3.5"><Badge status={vs} /></td>
                      <td className="px-5 py-3.5">
                        <Btn variant="outline" size="sm">Contactar dueño</Btn>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          <div className="px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">{proximas.length} vacunas requieren atención</p>
          </div>
        </div>
      )}

      {/* Carnet tab */}
      {tab === 'carnet' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-end gap-4 flex-wrap">
              <div className="flex-1 min-w-52 max-w-sm">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Seleccionar mascota
                </label>
                <select
                  value={selectedPetId}
                  onChange={e => setSelectedPetId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-900 bg-white"
                >
                  {PETS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {getOwner(p.ownerId)?.name}
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
                    <p className="text-xs text-slate-400">{pet.species} · {pet.breed} · {getOwner(pet.ownerId)?.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Ico name="syringe" size={15} className="text-teal-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Carnet de vacunación — {pet?.name}
              </h3>
            </div>
            {carnetVaccs.length === 0 ? (
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
                    {['Vacuna', 'Fecha de aplicación', 'Próxima dosis', 'Días restantes', 'Lote', 'Veterinario', 'Estado'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {carnetVaccs.map(v => {
                    const vet = getVet(v.vetId)
                    const vs = vaccineStatus(v.nextDue)
                    const days = vaccDaysLeft(v.nextDue)
                    let daysLabel = ''
                    let daysClass = ''
                    if (days < 0) { daysLabel = `Hace ${Math.abs(days)} días`; daysClass = 'text-red-600 font-semibold' }
                    else if (days === 0) { daysLabel = 'Hoy'; daysClass = 'text-red-600 font-semibold' }
                    else { daysLabel = `${days} días`; daysClass = days <= 30 ? 'text-amber-600 font-semibold' : 'text-slate-600' }

                    return (
                      <tr key={v.id} className={`hover:bg-slate-50 transition-colors ${vs === 'Vencida' ? 'bg-red-50/30' : ''}`}>
                        <td className="px-5 py-3.5 font-medium text-slate-800">{v.name}</td>
                        <td className="px-5 py-3.5 text-slate-600 tabular-nums">{formatDate(v.date)}</td>
                        <td className="px-5 py-3.5 text-slate-600 tabular-nums">{formatDate(v.nextDue)}</td>
                        <td className={`px-5 py-3.5 tabular-nums ${daysClass}`}>{daysLabel}</td>
                        <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{v.batch}</td>
                        <td className="px-5 py-3.5 text-slate-600">{vet?.name}</td>
                        <td className="px-5 py-3.5"><Badge status={vs} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {showModal && <RegistrarVacunaModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
