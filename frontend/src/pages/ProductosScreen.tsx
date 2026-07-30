import { useState, useMemo } from 'react'
import { CATALOG, CATALOG_CATEGORIES } from '../data/mockData'
import { formatPrice, catalogStockStatus, margin } from '../utils/helpers'
import { KPICard } from '../components/KPICard'
import { Btn } from '../components/Btn'
import { Ico } from '../components/Ico'
import { SearchInput } from '../components/SearchInput'
import { EmptyState } from '../components/EmptyState'
import { Badge } from '../components/Badge'
import { NuevoProductoModal } from '../components/modals/NuevoProductoModal'

export function ProductosScreen() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')
  const [showModal, setShowModal] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return CATALOG.filter(p => {
      const matchCat = category === 'Todos' || p.category === category
      const matchQ = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      return matchCat && matchQ
    })
  }, [search, category])

  const stats = useMemo(() => {
    const withCost = CATALOG.filter(p => p.cost > 0)
    const avgMargin = withCost.length
      ? Math.round(withCost.reduce((acc, p) => acc + margin(p), 0) / withCost.length)
      : 0
    const totalValuation = CATALOG.filter(p => p.controlsStock).reduce((acc, p) => acc + p.qty * p.price, 0)
    return { total: CATALOG.length, avgMargin, totalValuation, services: CATALOG.filter(p => !p.controlsStock).length }
  }, [])

  function marginColor(pct: number): string {
    if (pct >= 35) return 'text-emerald-700'
    if (pct >= 20) return 'text-teal-600'
    if (pct >= 10) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard label="Total productos" value={stats.total} sub="En catálogo" icon="package" color="blue" />
        <KPICard label="Margen promedio" value={`${stats.avgMargin}%`} sub="Sobre precio de venta" icon="trendUp" color="teal" />
        <KPICard label="Servicios" value={stats.services} sub="Sin control de stock" icon="file" color="purple" />
        <KPICard label="Valuación catálogo" value={formatPrice(stats.totalValuation)} sub="Productos con stock" icon="layers" color="amber" />
      </div>

      {/* Category tabs + search */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATALOG_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  category === cat
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-52">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar producto..." />
            </div>
            <Btn size="sm" onClick={() => setShowModal(true)}>
              <Ico name="plus" size={13} />
              Nuevo producto
            </Btn>
          </div>
        </div>

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
                ['IVA', 'right'],
                ['', 'left'],
              ].map(([h, align]) => (
                <th key={h} className={`text-${align} px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <EmptyState title="Sin resultados" description="No hay productos que coincidan con la búsqueda." />
                </td>
              </tr>
            ) : (
              filtered.map(p => {
                const st = catalogStockStatus(p)
                const mgn = margin(p)
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="font-medium text-slate-800">{p.name}</p>
                        {p.barcode && (
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{p.barcode}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-slate-800 tabular-nums">
                      {formatPrice(p.price)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-500 tabular-nums">
                      {p.cost > 0 ? formatPrice(p.cost) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {p.cost > 0 ? (
                        <span className={`font-semibold tabular-nums ${marginColor(mgn)}`}>
                          {mgn}%
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {p.controlsStock ? (
                        <span className={`font-semibold tabular-nums ${p.qty === 0 ? 'text-red-600' : p.qty < p.min ? 'text-amber-600' : 'text-slate-800'}`}>
                          {p.qty}
                          <span className="text-slate-400 text-xs font-normal ml-1">{p.unit}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">Sin control</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {st ? <Badge status={st} /> : (
                        <span className="text-xs text-slate-400">Servicio</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right text-slate-500 tabular-nums">
                      {p.iva}%
                    </td>
                    <td className="px-4 py-3.5">
                      <Btn variant="ghost" size="sm">
                        <Ico name="edit" size={13} />
                      </Btn>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-400">{filtered.length} productos</p>
        </div>
      </div>

      {showModal && <NuevoProductoModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
