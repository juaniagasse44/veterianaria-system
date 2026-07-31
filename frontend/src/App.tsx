import { useState } from 'react'
import type { Screen } from './types'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { Ico } from './components/Ico'
import { LoginScreen } from './pages/LoginScreen'
import { DashboardScreen } from './pages/DashboardScreen'
import { MascotasScreen } from './pages/MascotasScreen'
import { TurnosScreen } from './pages/TurnosScreen'
import { DuenosScreen } from './pages/DuenosScreen'
import { StockScreen } from './pages/StockScreen'
import { HistoriaScreen } from './pages/HistoriaScreen'
import { VacunasScreen } from './pages/VacunasScreen'
import { ProductosScreen } from './pages/ProductosScreen'
import { VeterinariosScreen } from './pages/VeterinariosScreen'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center animate-pulse">
          <Ico name="heart" size={18} className="text-white" />
        </div>
        <p className="text-sm text-slate-400">Cargando…</p>
      </div>
    </div>
  )
}

function Dashboard() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)

  function renderScreen() {
    switch (screen) {
      case 'dashboard':   return <DashboardScreen onNavigate={setScreen} />
      case 'mascotas':    return <MascotasScreen />
      case 'turnos':      return <TurnosScreen />
      case 'duenos':      return <DuenosScreen />
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
    </div>
  )
}

function AppShell() {
  const { status } = useAuth()

  if (status === 'loading') return <LoadingScreen />
  if (status === 'unauthenticated') return <LoginScreen />
  return <Dashboard />
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
