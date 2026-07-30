import { Modal } from '../Modal'
import { FormField } from '../FormField'
import { Input } from '../Input'
import { Select } from '../Select'
import { Btn } from '../Btn'

export function NuevoVetModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Nuevo veterinario" onClose={onClose}>
      <div className="space-y-4">
        <FormField label="Nombre completo">
          <Input placeholder="Ej. Dra. Ana López" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Matrícula">
            <Input placeholder="Ej. MV-12.345" />
          </FormField>
          <FormField label="Especialidad">
            <Select>
              <option>Clínica General</option>
              <option>Cirugía</option>
              <option>Dermatología</option>
              <option>Traumatología</option>
              <option>Cardiología</option>
              <option>Oftalmología</option>
              <option>Oncología</option>
              <option>Otra</option>
            </Select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Teléfono">
            <Input placeholder="Ej. 11 4523-8901" />
          </FormField>
          <FormField label="Email">
            <Input type="email" placeholder="nombre@clinica.com.ar" />
          </FormField>
        </div>
        <FormField label="Notas (opcional)">
          <textarea
            rows={2}
            placeholder="Días de atención, observaciones..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </FormField>
        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose}>Guardar veterinario</Btn>
          <Btn variant="outline" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </Modal>
  )
}
