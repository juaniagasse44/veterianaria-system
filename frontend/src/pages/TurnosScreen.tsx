import type { ApptStatus } from '../types'
import { APPTS, VETS } from '../data/mockData'
import { parseTime, getPet, getOwner } from '../utils/helpers'
import { Btn } from '../components/Btn'
import { Ico } from '../components/Ico'
import { Badge } from '../components/Badge'

const PX_PER_MIN = 1.5
const GRID_START = 8 * 60
const GRID_END = 18 * 60

const APPT_BG: Record<ApptStatus, string> = {
  Pendiente: '#fffbeb',
  Confirmado: '#eff6ff',
  Atendido: '#f0fdfa',
  Cancelado: '#fef2f2',
}
const APPT_BORDER: Record<ApptStatus, string> = {
  Pendiente: '#f59e0b',
  Confirmado: '#3b82f6',
  Atendido: '#0d9488',
  Cancelado: '#ef4444',
}

export function TurnosScreen({ onNewAppt }: { onNewAppt: () => void }) {
  const hours = Array.from({ length: 11 }, (_, i) => i + 8)

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors bg-white">
            <Ico name="chevLeft" size={15} />
          </button>
          <div className="bg-white border border-slate-200 rounded-lg px-4 py-2">
            <p className="text-sm font-semibold text-slate-900">Miércoles, 29 de julio de 2026</p>
          </div>
          <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors bg-white">
            <Ico name="chevRight" size={15} />
          </button>
          <span className="text-xs text-slate-400 ml-1">{APPTS.length} turnos</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-2">
            {VETS.map(v => (
              <div key={v.id} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: v.hue }} />
                <span className="text-xs text-slate-600 whitespace-nowrap">
                  {v.name.replace('Dra. ', '').replace('Dr. ', '')}
                </span>
              </div>
            ))}
          </div>
          <Btn onClick={onNewAppt}>
            <Ico name="plus" size={15} />
            Nuevo turno
          </Btn>
        </div>
      </div>

      {/* Agenda grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Vet header row */}
        <div
          className="grid border-b border-slate-200 bg-slate-50"
          style={{ gridTemplateColumns: '64px repeat(3, 1fr)' }}
        >
          <div className="border-r border-slate-200" />
          {VETS.map((v, i) => (
            <div
              key={v.id}
              className={`px-4 py-3.5 ${i < VETS.length - 1 ? 'border-r border-slate-200' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.hue }} />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{v.name}</p>
                  <p className="text-xs text-slate-400">{v.specialty}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable time grid */}
        <div className="overflow-y-auto" style={{ maxHeight: '560px' }}>
          <div className="grid" style={{ gridTemplateColumns: '64px repeat(3, 1fr)' }}>
            {/* Time labels column */}
            <div className="border-r border-slate-200">
              {hours.map(h => (
                <div
                  key={h}
                  className="flex items-start justify-end pr-3 pt-1"
                  style={{ height: `${60 * PX_PER_MIN}px` }}
                >
                  <span className="text-xs text-slate-400 font-medium tabular-nums">{h}:00</span>
                </div>
              ))}
            </div>

            {/* One column per vet */}
            {VETS.map((v, vi) => {
              const vetAppts = APPTS.filter(a => a.vetId === v.id && a.date === '2026-07-29')
              const totalHeight = (GRID_END - GRID_START) * PX_PER_MIN

              return (
                <div
                  key={v.id}
                  className={`relative ${vi < VETS.length - 1 ? 'border-r border-slate-200' : ''}`}
                  style={{ height: `${totalHeight}px` }}
                >
                  {/* Hour grid lines */}
                  {hours.map(h => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-slate-100"
                      style={{ top: `${(h - 8) * 60 * PX_PER_MIN}px` }}
                    />
                  ))}
                  {/* Half-hour lines */}
                  {hours.slice(0, -1).map(h => (
                    <div
                      key={`${h}h`}
                      className="absolute left-0 right-0 border-t border-dashed border-slate-50"
                      style={{ top: `${((h - 8) * 60 + 30) * PX_PER_MIN}px` }}
                    />
                  ))}

                  {/* Appointment blocks */}
                  {vetAppts.map(a => {
                    const top = (parseTime(a.time) - GRID_START) * PX_PER_MIN
                    const height = Math.max(a.duration * PX_PER_MIN, 32)
                    const pet = getPet(a.petId)
                    const owner = getOwner(a.ownerId)

                    return (
                      <div
                        key={a.id}
                        className="absolute left-1.5 right-1.5 rounded-lg px-2.5 py-2 cursor-pointer hover:brightness-95 transition-all overflow-hidden group"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          backgroundColor: APPT_BG[a.status],
                          borderLeft: `3px solid ${APPT_BORDER[a.status]}`,
                          opacity: a.status === 'Cancelado' ? 0.55 : 1,
                        }}
                      >
                        <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                          {a.time} · {pet?.name}
                        </p>
                        {height > 38 && (
                          <p className="text-xs text-slate-500 truncate leading-tight mt-0.5">{a.reason}</p>
                        )}
                        {height > 55 && (
                          <p className="text-xs text-slate-400 truncate leading-tight">{owner?.name}</p>
                        )}
                        {height > 70 && (
                          <div className="mt-1">
                            <Badge status={a.status} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Status legend */}
      <div className="flex items-center gap-5 flex-wrap">
        {(
          [
            ['Atendido', 'bg-teal-500'],
            ['Confirmado', 'bg-blue-500'],
            ['Pendiente', 'bg-amber-400'],
            ['Cancelado', 'bg-red-400'],
          ] as [ApptStatus, string][]
        ).map(([s, bg]) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${bg}`} />
            <span className="text-xs text-slate-500">{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
