import { useState } from 'react'
import type { Screen } from './types'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { NuevoTurnoModal } from './components/modals/NuevoTurnoModal'
import { NuevoDuenoModal } from './components/modals/NuevoDuenoModal'
import { DashboardScreen } from './pages/DashboardScreen'
import { MascotasScreen } from './pages/MascotasScreen'
import { TurnosScreen } from './pages/TurnosScreen'
import { DuenosScreen } from './pages/DuenosScreen'
import { StockScreen } from './pages/StockScreen'
import { HistoriaScreen } from './pages/HistoriaScreen'
import { VacunasScreen } from './pages/VacunasScreen'
import { ProductosScreen } from './pages/ProductosScreen'
import { VeterinariosScreen } from './pages/VeterinariosScreen'

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showNuevoTurno, setShowNuevoTurno] = useState(false)
  const [showNuevoDueno, setShowNuevoDueno] = useState(false)

  function renderScreen() {
    switch (screen) {
      case 'dashboard':   return <DashboardScreen onNavigate={setScreen} />
      case 'mascotas':    return <MascotasScreen />
      case 'turnos':      return <TurnosScreen onNewAppt={() => setShowNuevoTurno(true)} />
      case 'duenos':      return <DuenosScreen onNewOwner={() => setShowNuevoDueno(true)} />
      case 'stock':       return <StockScreen />
      case 'historia':    return <HistoriaScreen />
      case 'vacunas':     return <VacunasScreen />
      case 'productos':   return <ProductosScreen />
      case 'veterinarios': return <VeterinariosScreen />
      default:            return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        current={screen}
        onNavigate={setScreen}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <TopBar screen={screen} onMenuToggle={() => setMobileOpen(o => !o)} />
      <main className="lg:ml-60 pt-16 min-h-screen">
        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">{renderScreen()}</div>
      </main>

      {showNuevoTurno && <NuevoTurnoModal onClose={() => setShowNuevoTurno(false)} />}
      {showNuevoDueno && <NuevoDuenoModal onClose={() => setShowNuevoDueno(false)} />}
    </div>
  )
}
