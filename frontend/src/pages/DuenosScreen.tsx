import { useState, useMemo } from 'react'
import { OWNERS } from '../data/mockData'
import { getPet, formatDate } from '../utils/helpers'
import { Btn } from '../components/Btn'
import { Ico } from '../components/Ico'
import { SearchInput } from '../components/SearchInput'
import { EmptyState } from '../components/EmptyState'

export function DuenosScreen({ onNewOwner }: { onNewOwner: () => void }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return OWNERS.filter(
      o =>
        o.name.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.dni.includes(q) ||
        o.phone.includes(q),
    )
  }, [search])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-52 max-w-sm">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, DNI, email o teléfono..."
          />
        </div>
        <Btn variant="outline" size="sm">
          <Ico name="filter" size={13} />
          Filtrar
        </Btn>
        <Btn size="sm" onClick={onNewOwner}>
          <Ico name="plus" size={13} />
          Nuevo dueño
        </Btn>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {['Propietario', 'DNI', 'Email', 'Teléfono', 'Mascotas', 'Cliente desde'].map(h => (
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    title="Sin resultados"
                    description="No hay dueños que coincidan con la búsqueda."
                  />
                </td>
              </tr>
            ) : (
              filtered.map(o => (
                <tr key={o.id} className="hover:bg-slate-50 cursor-pointer transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
                        {o.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{o.name}</p>
                        <p className="text-xs text-slate-400 truncate">{o.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 tabular-nums">{o.dni}</td>
                  <td className="px-5 py-3.5 text-slate-600">{o.email}</td>
                  <td className="px-5 py-3.5 text-slate-600 tabular-nums">{o.phone}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 flex-wrap">
                      {o.petIds.length === 0 ? (
                        <span className="text-slate-400 text-xs">Sin mascotas</span>
                      ) : (
                        o.petIds.map(pid => {
                          const p = getPet(pid)
                          return (
                            <span
                              key={pid}
                              className="bg-teal-50 text-teal-700 text-xs px-2 py-0.5 rounded-full border border-teal-100 font-medium"
                            >
                              {p?.name}
                            </span>
                          )
                        })
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 tabular-nums">{formatDate(o.since)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">{filtered.length} dueños registrados</p>
    </div>
  )
}
