import { useEffect, useRef, useState } from 'react'
import type { ApiVeterinarian } from '../types'
import { listVeterinarians, deleteVeterinarian } from '../api/veterinarians'
import { ApiError } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import { colorForId } from '../utils/helpers'
import { KPICard } from '../components/KPICard'
import { Btn } from '../components/Btn'
import { Ico } from '../components/Ico'
import { SearchInput } from '../components/SearchInput'
import { EmptyState } from '../components/EmptyState'
import { NuevoVetModal } from '../components/modals/NuevoVetModal'

type ModalState = { mode: 'create' } | { mode: 'edit'; vet: ApiVeterinarian } | null

export function VeterinariosScreen() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [search, setSearch] = useState('')
  const [vets, setVets] = useState<ApiVeterinarian[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const isFirstRun = useRef(true)
  const requestId = useRef(0)

  // El backend siempre filtra por `active` (true por defecto, sin opción de
  // "todos"), pero la tabla necesita mostrar activos e inactivos juntos con
  // su badge de estado — así que se piden ambos grupos y se combinan.
  async function load(currentSearch: string) {
    const thisRequest = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const [activeResult, inactiveResult] = await Promise.all([
        listVeterinarians({ search: currentSearch || undefined, active: true, limit: 100 }),
        listVeterinarians({ search: currentSearch || undefined, active: false, limit: 100 }),
      ])
      if (thisRequest !== requestId.current) return
      const combined = [...activeResult.data, ...inactiveResult.data].sort((a, b) =>
        a.fullName.localeCompare(b.fullName),
      )
      setVets(combined)
    } catch (err) {
      if (thisRequest !== requestId.current) return
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar la lista de veterinarios.')
    } finally {
      if (thisRequest === requestId.current) setLoading(false)
    }
  }

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      load(search)
      return
    }
    const timer = setTimeout(() => load(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  async function handleDelete(vet: ApiVeterinarian) {
    if (!window.confirm(`¿Dar de baja a ${vet.fullName}? No podrá revertirse desde acá.`)) return
    setActionError(null)
    try {
      await deleteVeterinarian(vet.id)
      await load(search)
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'No se pudo dar de baja al veterinario.')
    }
  }

  function openModal(state: ModalState) {
    setActionError(null)
    setModal(state)
  }

  function handleSaved() {
    setModal(null)
    load(search)
  }

  const activeCount = vets.filter(v => v.active).length
  const specialtiesCount = new Set(vets.map(v => v.specialty).filter((s): s is string => !!s)).size

  return (
    <div className="space-y-4">
      {/* KPI summary */}
      <div className="grid grid-cols-3 gap-4">
        <KPICard
          label="Veterinarios activos"
          value={activeCount}
          sub="En ejercicio"
          icon="stethoscope"
          color="teal"
        />
        <KPICard
          label="Total en nómina"
          value={vets.length}
          sub="Incluyendo inactivos"
          icon="users"
          color="blue"
        />
        <KPICard
          label="Especialidades"
          value={specialtiesCount}
          sub="Áreas cubiertas"
          icon="file"
          color="purple"
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 max-w-sm">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, especialidad o matrícula..."
          />
        </div>
        {isAdmin ? (
          <Btn size="sm" onClick={() => openModal({ mode: 'create' })}>
            <Ico name="plus" size={13} />
            Nuevo veterinario
          </Btn>
        ) : (
          <p className="text-xs text-slate-400 max-w-xs">
            Solo un administrador puede crear, editar o dar de baja veterinarios.
          </p>
        )}
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
          {actionError}
        </div>
      )}

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
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState icon="clock" title="Cargando..." description="Buscando veterinarios en la base de datos." />
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
                      <Btn variant="outline" size="sm" onClick={() => load(search)}>
                        Reintentar
                      </Btn>
                    }
                  />
                </td>
              </tr>
            ) : vets.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState title="Sin resultados" description="No hay veterinarios que coincidan con la búsqueda." />
                </td>
              </tr>
            ) : (
              vets.map(v => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: colorForId(v.id) }}
                      >
                        {v.fullName
                          .split(' ')
                          .filter(n => n.length > 2)
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{v.fullName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 font-mono text-xs">{v.licenseNumber ?? '—'}</td>
                  <td className="px-5 py-4">
                    {v.specialty ? (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                        {v.specialty}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-600 tabular-nums">{v.phone ?? '—'}</td>
                  <td className="px-5 py-4 text-slate-600">{v.email ?? '—'}</td>
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
                    {isAdmin && v.active ? (
                      <div className="flex items-center gap-1.5">
                        <Btn variant="ghost" size="sm" onClick={() => openModal({ mode: 'edit', vet: v })}>
                          <Ico name="edit" size={13} />
                        </Btn>
                        <Btn variant="danger" size="sm" onClick={() => handleDelete(v)}>
                          <Ico name="x" size={13} />
                        </Btn>
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal?.mode === 'create' && <NuevoVetModal onClose={() => setModal(null)} onSaved={handleSaved} />}
      {modal?.mode === 'edit' && (
        <NuevoVetModal vet={modal.vet} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
    </div>
  )
}
