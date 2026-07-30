import { Modal } from '../Modal'
import { FormField } from '../FormField'
import { Input } from '../Input'
import { Select } from '../Select'
import { Btn } from '../Btn'
import { PETS, VETS } from '../../data/mockData'
import { getOwner } from '../../utils/helpers'

export function NuevoTurnoModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Nuevo turno" onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Fecha">
            <Input type="date" value="2026-07-29" />
          </FormField>
          <FormField label="Hora">
            <Input type="time" value="09:00" />
          </FormField>
        </div>
        <FormField label="Mascota">
          <Select>
            {PETS.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} — {getOwner(p.ownerId)?.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Veterinario">
          <Select>
            {VETS.map(v => (
              <option key={v.id} value={v.id}>
                {v.name} · {v.specialty}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Duración estimada">
          <Select>
            <option>30 minutos</option>
            <option>45 minutos</option>
            <option>60 minutos</option>
            <option>90 minutos</option>
          </Select>
        </FormField>
        <FormField label="Motivo de consulta">
          <Input placeholder="Ej. Control anual, vacunación, castración..." />
        </FormField>
        <FormField label="Notas previas (opcional)">
          <textarea
            rows={2}
            placeholder="Información relevante antes del turno..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </FormField>
        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose}>Confirmar turno</Btn>
          <Btn variant="outline" onClick={onClose}>
            Cancelar
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
