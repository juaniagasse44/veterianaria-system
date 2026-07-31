import { useEffect, useMemo, useRef, useState } from 'react'
import type { ApiProduct, ApiProductCategory, ApiStockLevel, ApiStockMovement } from '../types'
import { listProducts, listProductCategories } from '../api/products'
import { listStockLevels, listLowStock, getStockValuation, adjustStock, listStockMovements } from '../api/stock'
import { ApiError } from '../lib/api'
import { formatPrice } from '../utils/helpers'
import { KPICard } from '../components/KPICard'
import { Btn } from '../components/Btn'
import { Ico } from '../components/Ico'
import { SearchInput } from '../components/SearchInput'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { FormField } from '../components/FormField'
import { Input } from '../components/Input'

interface Row {
  product: ApiProduct
  quantity: number
  minQuantity: number
  hasLevel: boolean
}

const MOVEMENT_LABELS: Record<string, string> = {
  INITIAL: 'Carga inicial',
  PURCHASE: 'Compra',
  SALE: 'Venta',
  ADJUSTMENT: 'Ajuste',
  RETURN: 'Devolución',
}

function rowStatus(row: Row): 'OK' | 'Bajo' | 'Sin stock' {
  if (row.quantity === 0) return 'Sin stock'
  if (row.quantity < row.minQuantity) return 'Bajo'
  return 'OK'
}

export function StockScreen() {
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [categories, setCategories] = useState<ApiProductCategory[]>([])
  const [lowCount, setLowCount] = useState(0)
  const [valuation, setValuation] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const [adjustRow, setAdjustRow] = useState<Row | null>(null)
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustMin, setAdjustMin] = useState('')
  const [adjustNotes, setAdjustNotes] = useState('')
  const [adjustLoading, setAdjustLoading] = useState(false)
  const [adjustError, setAdjustError] = useState<string | null>(null)
  const [movements, setMovements] = useState<ApiStockMovement[]>([])
  const [movementsLoading, setMovementsLoading] = useState(false)

  const isFirstRun = useRef(true)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [productsResult, levels, low, val, categoriesResult] = await Promise.all([
        listProducts({ limit: 200 }),
        listStockLevels(),
        listLowStock(),
        getStockValuation(),
        listProductCategories({ limit: 100 }),
      ])
      setCategories(categoriesResult.data)
      const levelByProduct = new Map<number, ApiStockLevel>()
      levels.forEach(l => levelByProduct.set(l.productId, l))

      const merged: Row[] = productsResult.data
        .filter(p => p.trackStock)
        .map(product => {
          const level = levelByProduct.get(product.id)
          return {
            product,
            quantity: level?.quantity ?? 0,
            minQuantity: level?.minQuantity ?? 0,
            hasLevel: !!level,
          }
        })

      setRows(merged)
      setLowCount(low.length)
      setValuation(val.total)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el inventario.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      load()
    }
  }, [])

  const categoryById = useMemo(() => {
    const map = new Map<number, ApiProductCategory>()
    categories.forEach(c => map.set(c.id, c))
    return map
  }, [categories])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return rows
    return rows.filter(r => {
      const categoryName = r.product.categoryId ? categoryById.get(r.product.categoryId)?.name : undefined
      return r.product.name.toLowerCase().includes(q) || (categoryName?.toLowerCase().includes(q) ?? false)
    })
  }, [search, rows, categoryById])

  const outOfStockCount = useMemo(() => rows.filter(r => r.quantity === 0).length, [rows])

  function openAdjust(row: Row) {
    setActionError(null)
    setAdjustError(null)
    setAdjustRow(row)
    setAdjustQty(String(row.quantity))
    setAdjustMin(String(row.minQuantity))
    setAdjustNotes('')
    setMovements([])
    setMovementsLoading(true)
    listStockMovements(row.product.id)
      .then(setMovements)
      .catch(() => setMovements([]))
      .finally(() => setMovementsLoading(false))
  }

  async function handleAdjustSubmit() {
    if (!adjustRow) return
    const qtyNumber = Number(adjustQty)
    if (adjustQty === '' || Number.isNaN(qtyNumber) || qtyNumber < 0) {
      setAdjustError('Ingresá una cantidad válida.')
      return
    }
    const minNumber = adjustMin === '' ? undefined : Number(adjustMin)
    setAdjustError(null)
    setAdjustLoading(true)
    try {
      await adjustStock({
        productId: adjustRow.product.id,
        quantity: qtyNumber,
        minQuantity: minNumber,
        notes: adjustNotes || undefined,
      })
      setAdjustRow(null)
      await load()
    } catch (err) {
      setAdjustError(err instanceof ApiError ? err.message : 'No se pudo ajustar el stock.')
    } finally {
      setAdjustLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard label="Total productos" value={rows.length} sub="Con control de stock" icon="package" color="blue" />
        <KPICard label="Bajo mínimo" value={lowCount} sub="Requieren reposición" icon="alert" color="amber" />
        <KPICard label="Sin stock" value={outOfStockCount} sub="Agotados — urgente" icon="alert" color="red" />
        <KPICard label="Valuación total" value={formatPrice(valuation)} sub="A precio de costo" icon="trendUp" color="teal" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-52 max-w-sm">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar producto o categoría..." />
          </div>
        </div>

        {actionError && (
          <div className="mx-5 mt-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
            {actionError}
          </div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {[
                ['Producto', 'left'],
                ['Categoría', 'left'],
                ['Stock actual', 'right'],
                ['Mínimo', 'right'],
                ['Estado', 'left'],
                ['Precio', 'right'],
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
                <td colSpan={7}>
                  <EmptyState icon="clock" title="Cargando..." description="Buscando el inventario en el servidor." />
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
                      <Btn variant="outline" size="sm" onClick={() => load()}>
                        Reintentar
                      </Btn>
                    }
                  />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState title="Sin resultados" description="No hay productos con stock que coincidan con la búsqueda." />
                </td>
              </tr>
            ) : (
              filtered.map(row => {
                const st = rowStatus(row)
                return (
                  <tr
                    key={row.product.id}
                    className={`transition-colors ${st === 'Sin stock' ? 'bg-red-50/40 hover:bg-red-50/60' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-4 py-3.5 font-medium text-slate-800">{row.product.name}</td>
                    <td className="px-4 py-3.5">
                      {row.product.categoryId && categoryById.get(row.product.categoryId) ? (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          {categoryById.get(row.product.categoryId)!.name}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className={`font-semibold tabular-nums ${
                          row.quantity === 0 ? 'text-red-600' : row.quantity < row.minQuantity ? 'text-amber-600' : 'text-slate-800'
                        }`}
                      >
                        {row.quantity}
                      </span>
                      <span className="text-slate-400 text-xs ml-1">{row.product.unit}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-500 tabular-nums">{row.minQuantity}</td>
                    <td className="px-4 py-3.5">
                      <Badge status={st} />
                      {!row.hasLevel && <span className="ml-2 text-xs text-slate-400">sin inicializar</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-slate-700 tabular-nums">
                      {formatPrice(row.product.salePrice)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Btn variant="outline" size="sm" onClick={() => openAdjust(row)}>
                        Ajustar
                      </Btn>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        {!loading && !error && (
          <div className="px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">{filtered.length} productos</p>
          </div>
        )}
      </div>

      {adjustRow && (
        <Modal title={`Ajustar stock — ${adjustRow.product.name}`} onClose={() => setAdjustRow(null)}>
          <div className="space-y-4">
            {adjustError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
                {adjustError}
              </div>
            )}

            <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm flex items-center gap-6">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Stock actual</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
                  {adjustRow.quantity}
                  <span className="text-sm font-normal text-slate-500 ml-1">{adjustRow.product.unit}</span>
                </p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Stock mínimo</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">{adjustRow.minQuantity}</p>
              </div>
              <div className="ml-auto">
                <Badge status={rowStatus(adjustRow)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Nuevo stock">
                <Input type="number" value={adjustQty} onChange={setAdjustQty} placeholder="0" />
              </FormField>
              <FormField label="Nuevo mínimo">
                <Input type="number" value={adjustMin} onChange={setAdjustMin} placeholder="0" />
              </FormField>
            </div>

            <FormField label="Notas (opcional)">
              <textarea
                rows={2}
                value={adjustNotes}
                onChange={e => setAdjustNotes(e.target.value)}
                placeholder="Ej. conteo físico, ingreso de mercadería, merma..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
              />
            </FormField>

            <div className="flex gap-2 pt-1">
              <Btn onClick={handleAdjustSubmit} disabled={adjustLoading}>
                {adjustLoading ? 'Guardando...' : 'Guardar cambio'}
              </Btn>
              <Btn variant="outline" onClick={() => setAdjustRow(null)} disabled={adjustLoading}>
                Cancelar
              </Btn>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Últimos movimientos</p>
              {movementsLoading ? (
                <p className="text-xs text-slate-400">Cargando movimientos...</p>
              ) : movements.length === 0 ? (
                <p className="text-xs text-slate-400">Sin movimientos registrados para este producto.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {movements.slice(0, 10).map(m => (
                    <div key={m.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        {new Date(m.creationDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        {' — '}
                        {MOVEMENT_LABELS[m.type] ?? m.type}
                      </span>
                      <span className={`font-semibold tabular-nums ${m.quantity < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {m.quantity > 0 ? '+' : ''}
                        {m.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
