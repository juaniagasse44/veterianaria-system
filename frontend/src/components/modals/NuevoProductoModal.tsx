import { useState } from 'react'
import { Modal } from '../Modal'
import { FormField } from '../FormField'
import { Input } from '../Input'
import { Select } from '../Select'
import { Btn } from '../Btn'
import { CATALOG_CATEGORIES } from '../../data/mockData'

export function NuevoProductoModal({ onClose }: { onClose: () => void }) {
  const [controlsStock, setControlsStock] = useState(true)
  return (
    <Modal title="Nuevo producto" onClose={onClose}>
      <div className="space-y-4">
        <FormField label="Nombre del producto">
          <Input placeholder="Ej. Royal Canin Medium Adult 15kg" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Categoría">
            <Select>
              {CATALOG_CATEGORIES.filter(c => c !== 'Todos').map(c => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Código de barras">
            <Input placeholder="Ej. 7891000100103" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Precio de venta ($)">
            <Input type="number" placeholder="0" />
          </FormField>
          <FormField label="Costo ($)">
            <Input type="number" placeholder="0" />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Alícuota IVA">
            <Select>
              <option>21%</option>
              <option>10.5%</option>
              <option>0%</option>
            </Select>
          </FormField>
          <FormField label="Unidad de medida">
            <Input placeholder="Ej. bolsa 15kg, pipeta, dosis..." />
          </FormField>
        </div>

        <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <p className="text-sm font-medium text-slate-700">Controla stock</p>
            <p className="text-xs text-slate-400 mt-0.5">Activar para productos físicos con inventario</p>
          </div>
          <button
            type="button"
            onClick={() => setControlsStock(s => !s)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors border-2 border-transparent ${
              controlsStock ? 'bg-teal-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                controlsStock ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {controlsStock && (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Stock inicial">
              <Input type="number" placeholder="0" />
            </FormField>
            <FormField label="Stock mínimo">
              <Input type="number" placeholder="0" />
            </FormField>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose}>Guardar producto</Btn>
          <Btn variant="outline" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </Modal>
  )
}
