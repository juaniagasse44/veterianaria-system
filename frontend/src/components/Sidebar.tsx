import type { Screen } from '../types'
import { Ico } from './Ico'

const NAV: { id: Screen; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'duenos', label: 'Dueños', icon: 'users' },
  { id: 'mascotas', label: 'Mascotas', icon: 'paw' },
  { id: 'turnos', label: 'Turnos', icon: 'calendar' },
  { id: 'historia', label: 'Historia Clínica', icon: 'file' },
  { id: 'vacunas', label: 'Vacunas', icon: 'syringe' },
  { id: 'productos', label: 'Productos', icon: 'package' },
  { id: 'stock', label: 'Stock', icon: 'layers' },
  { id: 'veterinarios', label: 'Veterinarios', icon: 'stethoscope' },
]

export function Sidebar({
  current,
  onNavigate,
  mobileOpen,
  onClose,
}: {
  current: Screen
  onNavigate: (s: Screen) => void
  mobileOpen: boolean
  onClose: () => void
}) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-full w-60 bg-white border-r border-slate-200 flex flex-col z-30 transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="px-5 h-16 border-b border-slate-200 flex items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
              <Ico name="heart" size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-none">VetAdmin</p>
              <p className="text-xs text-slate-400 mt-0.5">Clínica Veterinaria</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          <p className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Gestión
          </p>
          {NAV.slice(0, 4).map(item => {
            const active = current === item.id
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); onClose() }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Ico name={item.icon} size={17} className={active ? 'text-teal-600' : 'text-slate-400'} />
                {item.label}
              </button>
            )
          })}

          <p className="px-3 pt-4 pb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Clínica
          </p>
          {NAV.slice(4, 7).map(item => {
            const active = current === item.id
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); onClose() }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Ico name={item.icon} size={17} className={active ? 'text-teal-600' : 'text-slate-400'} />
                {item.label}
              </button>
            )
          })}

          <p className="px-3 pt-4 pb-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Inventario
          </p>
          {NAV.slice(7).map(item => {
            const active = current === item.id
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); onClose() }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Ico name={item.icon} size={17} className={active ? 'text-teal-600' : 'text-slate-400'} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-slate-200 space-y-0.5 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              MR
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 truncate leading-tight">M. Rodríguez</p>
              <p className="text-xs text-slate-400 leading-tight">Recepcionista</p>
            </div>
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <Ico name="logout" size={15} className="text-slate-400" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
