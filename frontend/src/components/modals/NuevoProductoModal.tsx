import { useState, type FormEvent } from 'react'
import { Modal } from '../Modal'
import { FormField } from '../FormField'
import { Input } from '../Input'
import { Select } from '../Select'
import { Btn } from '../Btn'
import { createProduct, updateProduct } from '../../api/products'
import { setInitialStock } from '../../api/stock'
import { ApiError } from '../../lib/api'
import type { ApiProduct, ApiProductCategory, ProductUnit } from '../../types'

const UNIT_LABELS: Record<ProductUnit, string> = {
  UNIDAD: 'Unidad',
  KG: 'Kilogramo',
  LT: 'Litro',
}

export function NuevoProductoModal({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product?: ApiProduct
  categories: ApiProductCategory[]
  onClose: () => void
  onSaved: (product: ApiProduct) => void
}) {
  const isEdit = !!product
  const [name, setName] = useState(product?.name ?? '')
  const [categoryId, setCategoryId] = useState(product?.categoryId ? String(product.categoryId) : '')
  const [sku, setSku] = useState(product?.sku ?? '')
  const [barcode, setBarcode] = useState(product?.barcode ?? '')
  const [salePrice, setSalePrice] = useState(product ? String(product.salePrice) : '')
  const [cost, setCost] = useState(product?.cost ? String(product.cost) : '')
  const [vatRate, setVatRate] = useState(product?.vatRate !== null && product?.vatRate !== undefined ? String(product.vatRate) : '21')
  const [unit, setUnit] = useState<ProductUnit>(product?.unit ?? 'UNIDAD')
  const [trackStock, setTrackStock] = useState(product?.trackStock ?? true)
  const [initialQty, setInitialQty] = useState('')
  const [minQty, setMinQty] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (name.trim().length < 1) {
      setError('El nombre del producto es obligatorio.')
      return
    }
    const priceNumber = Number(salePrice)
    if (!salePrice || Number.isNaN(priceNumber) || priceNumber < 0) {
      setError('El precio de venta es obligatorio y debe ser un número válido.')
      return
    }

    setLoading(true)
    try {
      const input = {
        name,
        salePrice: priceNumber,
        categoryId: categoryId ? Number(categoryId) : undefined,
        sku: sku || undefined,
        barcode: barcode || undefined,
        cost: cost ? Number(cost) : undefined,
        vatRate: vatRate ? Number(vatRate) : undefined,
        unit,
        trackStock,
      }
      const saved = isEdit ? await updateProduct(product.id, input) : await createProduct(input)

      if (!isEdit && trackStock && initialQty) {
        try {
          await setInitialStock({
            productId: saved.id,
            quantity: Number(initialQty),
            minQuantity: minQty ? Number(minQty) : undefined,
          })
        } catch {
          // El producto ya se creó; el stock inicial se puede cargar después desde la pantalla de Stock.
        }
      }

      onSaved(saved)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el producto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Editar producto' : 'Nuevo producto'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <FormField label="Nombre del producto">
          <Input placeholder="Ej. Royal Canin Medium Adult 15kg" value={name} onChange={setName} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Categoría">
            <Select value={categoryId} onChange={setCategoryId}>
              <option value="">— Sin categoría —</option>
              {categories.map(c => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Código de barras">
            <Input placeholder="Ej. 7891000100103" value={barcode} onChange={setBarcode} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Precio de venta ($)">
            <Input type="number" placeholder="0" value={salePrice} onChange={setSalePrice} />
          </FormField>
          <FormField label="Costo ($)">
            <Input type="number" placeholder="0" value={cost} onChange={setCost} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Alícuota IVA">
            <Select value={vatRate} onChange={setVatRate}>
              <option value="21">21%</option>
              <option value="10.5">10.5%</option>
              <option value="0">0%</option>
            </Select>
          </FormField>
          <FormField label="Unidad de medida">
            <Select value={unit} onChange={v => setUnit(v as ProductUnit)}>
              {(Object.keys(UNIT_LABELS) as ProductUnit[]).map(u => (
                <option key={u} value={u}>
                  {UNIT_LABELS[u]}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField label="SKU (opcional)">
          <Input placeholder="Ej. AL-001" value={sku} onChange={setSku} />
        </FormField>

        <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <p className="text-sm font-medium text-slate-700">Controla stock</p>
            <p className="text-xs text-slate-400 mt-0.5">Activar para productos físicos con inventario</p>
          </div>
          <button
            type="button"
            onClick={() => setTrackStock(s => !s)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors border-2 border-transparent ${
              trackStock ? 'bg-teal-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                trackStock ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {trackStock && !isEdit && (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Stock inicial">
              <Input type="number" placeholder="0" value={initialQty} onChange={setInitialQty} />
            </FormField>
            <FormField label="Stock mínimo">
              <Input type="number" placeholder="0" value={minQty} onChange={setMinQty} />
            </FormField>
          </div>
        )}
        {trackStock && isEdit && (
          <p className="text-xs text-slate-400">
            El stock se carga y ajusta desde la pantalla de Stock.
          </p>
        )}

        <div className="flex gap-2 pt-2">
          <Btn type="submit" disabled={loading}>
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar producto'}
          </Btn>
          <Btn type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Btn>
        </div>
      </form>
    </Modal>
  )
}
