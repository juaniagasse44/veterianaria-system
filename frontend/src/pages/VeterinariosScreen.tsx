import { useState, useMemo } from 'react'
import { VET_STAFF } from '../data/mockData'
import { KPICard } from '../components/KPICard'
import { Btn } from '../components/Btn'
import { Ico } from '../components/Ico'
import { SearchInput } from '../components/SearchInput'
import { EmptyState } from '../components/EmptyState'
import { NuevoVetModal } from '../components/modals/NuevoVetModal'

export function VeterinariosScreen() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return VET_STAFF.filter(
      v =>
        v.name.toLowerCase().includes(q) ||
        v.specialty.toLowerCase().includes(q) ||
        v.matricula.toLowerCase().includes(q),
    )
  }, [search])

  const vetHues: Record<number, string> = { 1: '#0d9488', 2: '#7c3aed', 3: '#ea580c' }

  return (
    <div className="space-y-4">
      {/* KPI summary */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          label="Veterinarios activos"
          value={VET_STAFF.filter(v => v.active).length}
          sub="En ejercicio"
          icon="stethoscope"
          color="teal"
        />
        <KPICard
          label="Total en nómina"
          value={VET_STAFF.length}
          sub="Incluyendo inactivos"
          icon="users"
          color="blue"
        />
        <KPICard
          label="Especialidades"
          value={Array.from(new Set(VET_STAFF.map(v => v.specialty))).length}
          sub="Áreas cubiertas"
          icon="file"
          color="purple"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-sm">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, especialidad o matrícula..."
          />
        </div>
        <Btn size="sm" onClick={() => setShowModal(true)}>
          <Ico name="plus" size={13} />
          Nuevo veterinario
        </Btn>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Veterinario', 'Matrícula', 'Especialidad', 'Teléfono', 'Email', 'Estado', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState title="Sin resultados" description="No hay veterinarios que coincidan con la búsqueda." />
                </td>
              </tr>
            ) : (
              filtered.map(v => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: vetHues[v.id] ?? '#64748b' }}
                      >
                        {v.name.split(' ').filter(n => n.length > 2).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{v.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 font-mono text-xs">{v.matricula}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                      {v.specialty}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600 tabular-nums">{v.phone}</td>
                  <td className="px-5 py-4 text-slate-600">{v.email}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        v.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${v.active ? 'bg-emerald-500' : 'bg-slate-400'}`}
                      />
                      {v.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Btn variant="ghost" size="sm">
                      <Ico name="edit" size={13} />
                    </Btn>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && <NuevoVetModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
