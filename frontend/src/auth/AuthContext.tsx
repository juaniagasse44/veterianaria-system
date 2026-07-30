import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthUser, LoginResponse } from '../types'
import { api, clearToken, getToken, setToken } from '../lib/api'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setStatus('unauthenticated')
      return
    }
    api
      .get<AuthUser>('/auth/me')
      .then(me => {
        setUser(me)
        setStatus('authenticated')
      })
      .catch(() => {
        clearToken()
        setStatus('unauthenticated')
      })
  }, [])

  async function login(email: string, password: string) {
    const result = await api.post<LoginResponse>('/auth/login', { email, password })
    setToken(result.accessToken)
    setUser(result.user)
    setStatus('authenticated')
  }

  function logout() {
    clearToken()
    setUser(null)
    setStatus('unauthenticated')
  }

  return <AuthContext.Provider value={{ user, status, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
