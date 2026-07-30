import { useState, useMemo } from 'react'
import type { Product } from '../types'
import { PRODUCTS } from '../data/mockData'
import { stockStatus, formatPrice } from '../utils/helpers'
import { KPICard } from '../components/KPICard'
import { Btn } from '../components/Btn'
import { Ico } from '../components/Ico'
import { SearchInput } from '../components/SearchInput'
import { Badge } from '../components/Badge'
import { Modal } from '../components/Modal'
import { FormField } from '../components/FormField'
import { Input } from '../components/Input'
import { Select } from '../components/Select'

export function StockScreen() {
  const [search, setSearch] = useState('')
  const [adjustProd, setAdjustProd] = useState<Product | null>(null)
  const [adjustQty, setAdjustQty] = useState('')

  const stats = useMemo(() => {
    const low = PRODUCTS.filter(p => stockStatus(p) === 'Bajo').length
    const out = PRODUCTS.filter(p => stockStatus(p) === 'Sin stock').length
    const valuation = PRODUCTS.reduce((acc, p) => acc + p.qty * p.price, 0)
    return { low, out, valuation, total: PRODUCTS.length }
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return PRODUCTS.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q),
    )
  }, [search])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          label="Total productos"
          value={stats.total}
          sub="Artículos en catálogo"
          icon="package"
          color="blue"
        />
        <KPICard
          label="Bajo stock"
          value={stats.low}
          sub="Requieren reposición"
          icon="alert"
          color="amber"
        />
        <KPICard
          label="Sin stock"
          value={stats.out}
          sub="Agotados — urgente"
          icon="alert"
          color="red"
        />
        <KPICard
          label="Valuación total"
          value={formatPrice(stats.valuation)}
          sub="A precio de venta"
          icon="trendUp"
          color="teal"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-52 max-w-sm">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar producto, categoría o proveedor..."
            />
          </div>
          <Btn variant="outline" size="sm">
            <Ico name="filter" size={13} />
            Filtrar
          </Btn>
          <Btn size="sm">
            <Ico name="plus" size={13} />
            Agregar producto
          </Btn>
        </div>

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
                ['Proveedor', 'left'],
                ['', 'left'],
              ].map(([h, align]) => (
                <th
                  key={h}
                  className={`text-${align} px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(p => {
              const st = stockStatus(p)
              return (
                <tr
                  key={p.id}
                  className={`transition-colors ${st === 'Sin stock' ? 'bg-red-50/40 hover:bg-red-50/60' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-4 py-3.5 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span
                      className={`font-semibold tabular-nums ${
                        p.qty === 0
                          ? 'text-red-600'
                          : p.qty < p.min
                            ? 'text-amber-600'
                            : 'text-slate-800'
                      }`}
                    >
                      {p.qty}
                    </span>
                    <span className="text-slate-400 text-xs ml-1">{p.unit}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-500 tabular-nums">{p.min}</td>
                  <td className="px-4 py-3.5">
                    <Badge status={st} />
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-slate-700 tabular-nums">
                    {formatPrice(p.price)}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs">{p.supplier}</td>
                  <td className="px-4 py-3.5">
                    <Btn
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAdjustProd(p)
                        setAdjustQty(String(p.qty))
                      }}
                    >
                      Ajustar
                    </Btn>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-400">{filtered.length} productos</p>
        </div>
      </div>

      {adjustProd && (
        <Modal title={`Ajustar stock — ${adjustProd.name}`} onClose={() => setAdjustProd(null)}>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm flex items-center gap-6">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Stock actual</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">
                  {adjustProd.qty}
                  <span className="text-sm font-normal text-slate-500 ml-1">{adjustProd.unit}</span>
                </p>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Stock mínimo</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">{adjustProd.min}</p>
              </div>
              <div className="ml-auto">
                <Badge status={stockStatus(adjustProd)} />
              </div>
            </div>

            <FormField label="Nuevo stock">
              <Input type="number" value={adjustQty} onChange={setAdjustQty} placeholder="0" />
            </FormField>

            <FormField label="Motivo del ajuste">
              <Select>
                <option>Ingreso de mercadería</option>
                <option>Corrección de inventario</option>
                <option>Devolución a proveedor</option>
                <option>Uso interno</option>
                <option>Merma / vencimiento</option>
              </Select>
            </FormField>

            <FormField label="Notas (opcional)">
              <textarea
                rows={2}
                placeholder="Observaciones sobre el ajuste..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
              />
            </FormField>

            <div className="flex gap-2 pt-1">
              <Btn onClick={() => setAdjustProd(null)}>Guardar cambio</Btn>
              <Btn variant="outline" onClick={() => setAdjustProd(null)}>
                Cancelar
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
