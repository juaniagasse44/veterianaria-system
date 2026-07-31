import { useEffect, useMemo, useRef, useState } from 'react'
import type { ApiProduct, ApiProductCategory, ApiStockLevel } from '../types'
import { listProducts, deleteProduct, listProductCategories } from '../api/products'
import { listStockLevels } from '../api/stock'
import { ApiError } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import { formatPrice } from '../utils/helpers'
import { KPICard } from '../components/KPICard'
import { Btn } from '../components/Btn'
import { Ico } from '../components/Ico'
import { SearchInput } from '../components/SearchInput'
import { EmptyState } from '../components/EmptyState'
import { Badge } from '../components/Badge'
import { NuevoProductoModal } from '../components/modals/NuevoProductoModal'
import { CategoriasModal } from '../components/modals/CategoriasModal'

type ModalState = { mode: 'create' } | { mode: 'edit'; product: ApiProduct } | null

function marginColor(pct: number): string {
  if (pct >= 35) return 'text-emerald-700'
  if (pct >= 20) return 'text-teal-600'
  if (pct >= 10) return 'text-amber-600'
  return 'text-red-600'
}

function stockStatusFor(level: ApiStockLevel | undefined): 'OK' | 'Bajo' | 'Sin stock' | null {
  if (!level) return null
  if (level.quantity === 0) return 'Sin stock'
  if (level.quantity < level.minQuantity) return 'Bajo'
  return 'OK'
}

export function ProductosScreen() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [categories, setCategories] = useState<ApiProductCategory[]>([])
  const [stockLevels, setStockLevels] = useState<ApiStockLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const [showCategorias, setShowCategorias] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const isFirstRun = useRef(true)
  const requestId = useRef(0)

  async function loadCategories() {
    try {
      const result = await listProductCategories({ limit: 100 })
      setCategories(result.data)
    } catch {
      // Si falla, se muestra la tabla igual sin filtro por categoría.
    }
  }

  async function load(currentSearch: string, currentCategoryId: number | null) {
    const thisRequest = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const [productsResult, levels] = await Promise.all([
        listProducts({ search: currentSearch || undefined, categoryId: currentCategoryId ?? undefined, limit: 100 }),
        listStockLevels(),
      ])
      if (thisRequest !== requestId.current) return
      setProducts(productsResult.data)
      setStockLevels(levels)
    } catch (err) {
      if (thisRequest !== requestId.current) return
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el catálogo de productos.')
    } finally {
      if (thisRequest === requestId.current) setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    if (isFirstRun.current) {
      isFirstRun.current = false
      load(search, categoryId)
      return
    }
    const timer = setTimeout(() => load(search, categoryId), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryId])

  const levelByProduct = useMemo(() => {
    const map = new Map<number, ApiStockLevel>()
    stockLevels.forEach(l => map.set(l.productId, l))
    return map
  }, [stockLevels])

  const categoryById = useMemo(() => {
    const map = new Map<number, ApiProductCategory>()
    categories.forEach(c => map.set(c.id, c))
    return map
  }, [categories])

  const stats = useMemo(() => {
    const withCost = products.filter(p => p.margin.percent !== null)
    const avgMargin = withCost.length
      ? Math.round(withCost.reduce((acc, p) => acc + (p.margin.percent ?? 0), 0) / withCost.length)
      : 0
    const services = products.filter(p => !p.trackStock).length
    const valuation = products.reduce((acc, p) => {
      const level = levelByProduct.get(p.id)
      return acc + (level ? level.quantity * p.salePrice : 0)
    }, 0)
    return { total: products.length, avgMargin, services, valuation }
  }, [products, levelByProduct])

  async function handleDelete(product: ApiProduct) {
    if (!window.confirm(`¿Dar de baja "${product.name}"? No podrá revertirse desde acá.`)) return
    setActionError(null)
    try {
      await deleteProduct(product.id)
      await load(search, categoryId)
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'No se pudo dar de baja el producto.')
    }
  }

  function openModal(state: ModalState) {
    setActionError(null)
    setModal(state)
  }

  function handleSaved() {
    setModal(null)
    load(search, categoryId)
  }

  function handleCategoriesChanged() {
    loadCategories()
    load(search, categoryId)
  }

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard label="Total productos" value={stats.total} sub="En catálogo" icon="package" color="blue" />
        <KPICard label="Margen promedio" value={`${stats.avgMargin}%`} sub="Sobre precio de venta" icon="trendUp" color="teal" />
        <KPICard label="Servicios" value={stats.services} sub="Sin control de stock" icon="file" color="purple" />
        <KPICard label="Valuación catálogo" value={formatPrice(stats.valuation)} sub="Productos con stock" icon="layers" color="amber" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setCategoryId(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                categoryId === null ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  categoryId === c.id ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-52">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar producto..." />
            </div>
            <Btn variant="outline" size="sm" onClick={() => setShowCategorias(true)}>
              <Ico name="filter" size={13} />
              Categorías
            </Btn>
            <Btn size="sm" onClick={() => openModal({ mode: 'create' })}>
              <Ico name="plus" size={13} />
              Nuevo producto
            </Btn>
          </div>
        </div>

        {actionError && (
          <div className="mx-5 mt-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
            {actionError}
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {[
                ['Producto', 'left'],
                ['Categoría', 'left'],
                ['Precio venta', 'right'],
                ['Costo', 'right'],
                ['Margen', 'right'],
                ['Stock', 'right'],
                ['Estado', 'left'],
                ['', 'left'],
              ].map(([h, align]) => (
                <th key={h} className={`text-${align} px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState icon="clock" title="Cargando..." description="Buscando productos en el catálogo." />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState
                    icon="alert"
                    title="No se pudo cargar"
                    description={error}
                    action={
                      <Btn variant="outline" size="sm" onClick={() => load(search, categoryId)}>
                        Reintentar
                      </Btn>
                    }
                  />
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState title="Sin resultados" description="No hay productos que coincidan con la búsqueda." />
                </td>
              </tr>
            ) : (
              products.map(p => {
                const level = levelByProduct.get(p.id)
                const st = stockStatusFor(p.trackStock ? level : undefined)
                const mgn = p.margin.percent
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="font-medium text-slate-800">{p.name}</p>
                        {p.barcode && <p className="text-xs text-slate-400 font-mono mt-0.5">{p.barcode}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {p.categoryId && categoryById.get(p.categoryId) ? (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          {categoryById.get(p.categoryId)!.name}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-slate-800 tabular-nums">
                      {formatPrice(p.salePrice)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-500 tabular-nums">
                      {p.cost > 0 ? formatPrice(p.cost) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {mgn !== null ? (
                        <span className={`font-semibold tabular-nums ${marginColor(mgn)}`}>{Math.round(mgn)}%</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {p.trackStock ? (
                        <span
                          className={`font-semibold tabular-nums ${
                            !level || level.quantity === 0
                              ? 'text-red-600'
                              : level.quantity < level.minQuantity
                                ? 'text-amber-600'
                                : 'text-slate-800'
                          }`}
                        >
                          {level ? level.quantity : 0}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">Sin control</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {st ? <Badge status={st} /> : <span className="text-xs text-slate-400">Servicio</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Btn variant="ghost" size="sm" onClick={() => openModal({ mode: 'edit', product: p })}>
                          <Ico name="edit" size={13} />
                        </Btn>
                        {isAdmin && (
                          <Btn variant="danger" size="sm" onClick={() => handleDelete(p)}>
                            <Ico name="x" size={13} />
                          </Btn>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        {!loading && !error && (
          <div className="px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">{products.length} productos</p>
          </div>
        )}
      </div>

      {modal?.mode === 'create' && (
        <NuevoProductoModal categories={categories} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal?.mode === 'edit' && (
        <NuevoProductoModal
          product={modal.product}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
      {showCategorias && (
        <CategoriasModal
          categories={categories}
          onClose={() => setShowCategorias(false)}
          onChanged={handleCategoriesChanged}
        />
      )}
    </div>
  )
}
