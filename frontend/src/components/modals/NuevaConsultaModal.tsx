import { Modal } from '../Modal'
import { FormField } from '../FormField'
import { Input } from '../Input'
import { Select } from '../Select'
import { Btn } from '../Btn'
import { VETS } from '../../data/mockData'
import { TODAY_STR } from '../../utils/helpers'

export function NuevaConsultaModal({ petName, onClose }: { petName: string; onClose: () => void }) {
  return (
    <Modal title={`Nueva consulta — ${petName}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Fecha">
            <Input type="date" value={TODAY_STR} />
          </FormField>
          <FormField label="Peso (kg)">
            <Input type="number" placeholder="Ej. 12.5" />
          </FormField>
        </div>
        <FormField label="Veterinario">
          <Select>
            {VETS.map(v => (
              <option key={v.id} value={v.id}>{v.name} · {v.specialty}</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Motivo de consulta">
          <Input placeholder="Ej. Control anual, revisión post-operatoria..." />
        </FormField>
        <FormField label="Diagnóstico">
          <textarea
            rows={2}
            placeholder="Diagnóstico del veterinario..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </FormField>
        <FormField label="Tratamiento indicado">
          <textarea
            rows={2}
            placeholder="Medicación, procedimientos, indicaciones..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </FormField>
        <FormField label="Notas adicionales">
          <textarea
            rows={2}
            placeholder="Observaciones, indicaciones al propietario..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </FormField>
        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose}>Guardar consulta</Btn>
          <Btn variant="outline" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </Modal>
  )
}
