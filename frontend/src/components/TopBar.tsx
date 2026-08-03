import { useEffect, useRef, useState } from 'react'
import type { Screen } from '../types'
import { useAuth } from '../auth/AuthContext'
import { initials } from '../utils/helpers'
import { Ico } from './Ico'
import { useNotifications } from '../hooks/useNotifications'

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

export function TopBar({
  screen,
  onMenuToggle,
  onNavigate,
}: {
  screen: Screen
  onMenuToggle: () => void
  onNavigate: (s: Screen) => void
}) {
  const { user } = useAuth()
  const { items, loading, refresh } = useNotifications()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function toggle() {
    setOpen(o => {
      if (!o) refresh()
      return !o
    })
  }

  function goTo(s: Screen) {
    onNavigate(s)
    setOpen(false)
  }

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

      <div className="relative" ref={panelRef}>
        <button
          onClick={toggle}
          className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <Ico name="bell" size={17} />
          {items.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-30">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">Notificaciones</p>
            </div>

            {loading && items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Cargando…</p>
            )}

            {!loading && items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No hay notificaciones.</p>
            )}

            {items.map(item => (
              <button
                key={item.id}
                onClick={() => goTo(item.screen)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-50 last:border-b-0 transition-colors"
              >
                <span
                  className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                    item.urgent ? 'bg-red-50 text-red-500' : 'bg-teal-50 text-teal-600'
                  }`}
                >
                  <Ico name={item.icon} size={14} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-900 truncate">{item.title}</span>
                  <span className="block text-xs text-slate-500 truncate">{item.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-teal-700 transition-colors">
        {user ? initials(user.fullName) : ''}
      </div>
    </header>
  )
}
