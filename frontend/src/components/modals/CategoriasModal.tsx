import { useState, type FormEvent } from 'react'
import { Modal } from '../Modal'
import { Input } from '../Input'
import { Btn } from '../Btn'
import { Ico } from '../Ico'
import { EmptyState } from '../EmptyState'
import { createProductCategory, deleteProductCategory } from '../../api/products'
import { ApiError } from '../../lib/api'
import { useAuth } from '../../auth/AuthContext'
import type { ApiProductCategory } from '../../types'

export function CategoriasModal({
  categories,
  onClose,
  onChanged,
}: {
  categories: ApiProductCategory[]
  onClose: () => void
  onChanged: () => void
}) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (name.trim().length < 2) {
      setError('El nombre de la categoría debe tener al menos 2 caracteres.')
      return
    }
    setLoading(true)
    try {
      await createProductCategory({ name: name.trim() })
      setName('')
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la categoría.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(category: ApiProductCategory) {
    if (!window.confirm(`¿Dar de baja la categoría "${category.name}"?`)) return
    setError(null)
    try {
      await deleteProductCategory(category.id)
      onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo dar de baja la categoría.')
    }
  }

  return (
    <Modal title="Categorías de productos" onClose={onClose}>
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex gap-2">
          <Input placeholder="Ej. Alimentos" value={name} onChange={setName} />
          <Btn type="submit" size="sm" disabled={loading}>
            <Ico name="plus" size={13} />
            Agregar
          </Btn>
        </form>

        <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {categories.length === 0 ? (
            <EmptyState title="Sin categorías" description="Todavía no creaste ninguna categoría de productos." />
          ) : (
            categories.map(c => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-slate-700">{c.name}</span>
                {isAdmin && (
                  <Btn variant="danger" size="sm" onClick={() => handleDelete(c)}>
                    <Ico name="x" size={13} />
                  </Btn>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Btn variant="outline" onClick={onClose}>
            Cerrar
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
