import { useEffect, useRef, useState } from 'react'
import type { ApiOwner } from '../types'
import { listOwners, deleteOwner } from '../api/owners'
import { ApiError } from '../lib/api'
import { formatApiDate, initials } from '../utils/helpers'
import { Btn } from '../components/Btn'
import { Ico } from '../components/Ico'
import { SearchInput } from '../components/SearchInput'
import { EmptyState } from '../components/EmptyState'
import { NuevoDuenoModal } from '../components/modals/NuevoDuenoModal'

type ModalState = { mode: 'create' } | { mode: 'edit'; owner: ApiOwner } | null

export function DuenosScreen() {
  const [search, setSearch] = useState('')
  const [owners, setOwners] = useState<ApiOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const isFirstRun = useRef(true)
  const requestId = useRef(0)

  async function load(currentSearch: string) {
    const thisRequest = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const result = await listOwners({ search: currentSearch || undefined, limit: 100 })
      if (thisRequest !== requestId.current) return // una búsqueda más nueva ya está en curso
      setOwners(result.data)
    } catch (err) {
      if (thisRequest !== requestId.current) return
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar la lista de dueños.')
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

  async function handleDelete(owner: ApiOwner) {
    if (!window.confirm(`¿Dar de baja a ${owner.fullName}? No podrá revertirse desde acá.`)) return
    setActionError(null)
    try {
      await deleteOwner(owner.id)
      await load(search)
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'No se pudo dar de baja al dueño.')
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-52 max-w-sm">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, DNI o teléfono..."
          />
        </div>
        <Btn variant="outline" size="sm">
          <Ico name="filter" size={13} />
          Filtrar
        </Btn>
        <Btn size="sm" onClick={() => openModal({ mode: 'create' })}>
          <Ico name="plus" size={13} />
          Nuevo dueño
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
              {['Propietario', 'DNI', 'Email', 'Teléfono', 'Mascotas', 'Cliente desde', ''].map(h => (
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
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState icon="clock" title="Cargando..." description="Buscando dueños en la base de datos." />
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
            ) : owners.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    title="Sin resultados"
                    description="No hay dueños que coincidan con la búsqueda."
                  />
                </td>
              </tr>
            ) : (
              owners.map(o => (
                <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">
                        {initials(o.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{o.fullName}</p>
                        {o.address && <p className="text-xs text-slate-400 truncate">{o.address}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 tabular-nums">{o.document ?? '—'}</td>
                  <td className="px-5 py-3.5 text-slate-600">{o.email ?? '—'}</td>
                  <td className="px-5 py-3.5 text-slate-600 tabular-nums">{o.phone ?? '—'}</td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">—</td>
                  <td className="px-5 py-3.5 text-slate-500 tabular-nums">{formatApiDate(o.creationDate)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Btn variant="ghost" size="sm" onClick={() => openModal({ mode: 'edit', owner: o })}>
                        <Ico name="edit" size={13} />
                      </Btn>
                      <Btn variant="danger" size="sm" onClick={() => handleDelete(o)}>
                        <Ico name="x" size={13} />
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && !error && <p className="text-xs text-slate-400">{owners.length} dueños registrados</p>}

      {modal?.mode === 'create' && (
        <NuevoDuenoModal onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal?.mode === 'edit' && (
        <NuevoDuenoModal owner={modal.owner} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
    </div>
  )
}
