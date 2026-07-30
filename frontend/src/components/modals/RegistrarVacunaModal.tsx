import { Modal } from '../Modal'
import { FormField } from '../FormField'
import { Input } from '../Input'
import { Select } from '../Select'
import { Btn } from '../Btn'
import { PETS, VETS, CATALOG } from '../../data/mockData'
import { getOwner, TODAY_STR } from '../../utils/helpers'

export function RegistrarVacunaModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Registrar vacuna" onClose={onClose}>
      <div className="space-y-4">
        <FormField label="Mascota">
          <Select>
            {PETS.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {getOwner(p.ownerId)?.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Nombre de la vacuna">
          <Select>
            <option>Séxtuple (DHPPI+L)</option>
            <option>Antirrábica</option>
            <option>Bordetella</option>
            <option>Leptospirosis</option>
            <option>Triple Felina</option>
            <option>Leucemia Felina</option>
            <option>Otra (especificar)</option>
          </Select>
        </FormField>
        <FormField label="Producto asociado (opcional)">
          <Select>
            <option value="">— Sin asociar —</option>
            {CATALOG.filter(p => p.category === 'Vacuna').map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Veterinario">
          <Select>
            {VETS.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Fecha de aplicación">
            <Input type="date" value={TODAY_STR} />
          </FormField>
          <FormField label="Próxima dosis">
            <Input type="date" />
          </FormField>
        </div>
        <FormField label="Número de lote">
          <Input placeholder="Ej. LOT-2026-A0001" />
        </FormField>
        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose}>Registrar vacuna</Btn>
          <Btn variant="outline" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </Modal>
  )
}
