import type { Screen } from '../types'
import { Ico } from './Ico'

const SCREEN_TITLES: Record<Screen, string> = {
  dashboard: 'Dashboard',
  duenos: 'Dueños',
  mascotas: 'Mascotas',
  turnos: 'Turnos',
  historia: 'Historia Clínica',
  vacunas: 'Vacunas',
  productos: 'Productos',
  stock: 'Stock e Inventario',
  veterinarios: 'Veterinarios',
}

export function TopBar({ screen, onMenuToggle }: { screen: Screen; onMenuToggle: () => void }) {
  return (
    <header className="fixed top-0 left-0 lg:left-60 right-0 h-16 bg-white border-b border-slate-200 z-20 flex items-center px-4 lg:px-6 gap-3">
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors lg:hidden"
      >
        <Ico name="menu" size={18} />
      </button>

      <h1 className="text-sm font-semibold text-slate-900 mr-auto">{SCREEN_TITLES[screen]}</h1>

      <div className="relative hidden sm:block w-56">
        <Ico
          name="search"
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white placeholder:text-slate-400 transition-all"
        />
      </div>

      <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
        <Ico name="bell" size={17} />
        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
      </button>

      <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-teal-700 transition-colors">
        MR
      </div>
    </header>
  )
}
