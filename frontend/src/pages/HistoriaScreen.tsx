import { useState, useMemo } from 'react'
import { PETS, MED_RECORDS } from '../data/mockData'
import { getOwner, getPet, getVet, formatDate } from '../utils/helpers'
import { Btn } from '../components/Btn'
import { Ico } from '../components/Ico'
import { EmptyState } from '../components/EmptyState'
import { Badge } from '../components/Badge'
import { NuevaConsultaModal } from '../components/modals/NuevaConsultaModal'

export function HistoriaScreen() {
  const [selectedPetId, setSelectedPetId] = useState<number | ''>('')
  const [showModal, setShowModal] = useState(false)

  const pet = selectedPetId !== '' ? getPet(Number(selectedPetId)) : undefined
  const records = useMemo(
    () =>
      selectedPetId !== ''
        ? MED_RECORDS.filter(r => r.petId === Number(selectedPetId)).sort((a, b) =>
            b.date.localeCompare(a.date),
          )
        : [],
    [selectedPetId],
  )

  return (
    <div className="space-y-5">
      {/* Selector bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-52 max-w-sm">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
              Seleccionar mascota
            </label>
            <select
              value={selectedPetId}
              onChange={e => setSelectedPetId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 text-slate-900 bg-white"
            >
              <option value="">— Elegir mascota —</option>
              {PETS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.species} · {getOwner(p.ownerId)?.name})
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
                  {pet.species} · {pet.breed}
                </span>
                <span className="text-xs text-slate-400">{getOwner(pet.ownerId)?.name}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {pet.age} {pet.age === 1 ? 'año' : 'años'} · {pet.weight} kg ·{' '}
                {records.length} {records.length === 1 ? 'consulta registrada' : 'consultas registradas'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Content area */}
      {!pet ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon="file"
            title="Seleccioná una mascota"
            description="Elegí una mascota del selector para ver su historia clínica completa."
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
            const vet = getVet(r.vetId)
            const isFirst = i === 0
            return (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${isFirst ? 'bg-teal-500' : 'bg-slate-300'}`}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{r.reason}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDate(r.date)} · {vet?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.weightKg !== undefined && (
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                        <Ico name="weight" size={13} className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700 tabular-nums">
                          {r.weightKg} kg
                        </span>
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
                    <p className="text-sm text-slate-700 leading-relaxed">{r.diagnosis}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                      Tratamiento
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{r.treatment}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                      Notas
                    </p>
                    <p className="text-sm text-slate-500 leading-relaxed">{r.notes}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && pet && (
        <NuevaConsultaModal petName={pet.name} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
