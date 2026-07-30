import { Modal } from '../Modal'
import { FormField } from '../FormField'
import { Input } from '../Input'
import { Btn } from '../Btn'

export function NuevoDuenoModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Nuevo propietario" onClose={onClose}>
      <div className="space-y-4">
        <FormField label="Nombre completo">
          <Input placeholder="Ej. Juan Martínez" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="DNI">
            <Input placeholder="Ej. 35.890.123" />
          </FormField>
          <FormField label="Teléfono">
            <Input placeholder="Ej. 11 4523-8901" />
          </FormField>
        </div>
        <FormField label="Email">
          <Input type="email" placeholder="email@ejemplo.com" />
        </FormField>
        <FormField label="Dirección">
          <Input placeholder="Calle, número, barrio" />
        </FormField>
        <FormField label="Notas (opcional)">
          <textarea
            rows={2}
            placeholder="Información adicional del propietario..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 resize-none text-slate-900 placeholder:text-slate-400"
          />
        </FormField>
        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose}>Registrar dueño</Btn>
          <Btn variant="outline" onClick={onClose}>
            Cancelar
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
