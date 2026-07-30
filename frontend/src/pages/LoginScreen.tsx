import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../lib/api'
import { Ico } from '../components/Ico'
import { Btn } from '../components/Btn'
import { FormField } from '../components/FormField'
import { Input } from '../components/Input'

export function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center mb-3">
            <Ico name="heart" size={22} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">VetAdmin</h1>
          <p className="text-sm text-slate-400">Clínica Veterinaria</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4"
        >
          <h2 className="text-sm font-semibold text-slate-900">Iniciar sesión</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <FormField label="Email">
            <Input
              type="email"
              placeholder="admin@vetsystem.local"
              value={email}
              onChange={setEmail}
            />
          </FormField>
          <FormField label="Contraseña">
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
            />
          </FormField>

          <Btn type="submit" disabled={loading} className="w-full justify-center">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Btn>
        </form>
      </div>
    </div>
  )
}
