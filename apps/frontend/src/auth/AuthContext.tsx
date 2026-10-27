import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  api,
  clearSessionTokens,
  getAccessToken,
  setSessionTokens,
  type ApiCompany,
  type ApiUser,
  type LoginResponse,
  type MeResponse,
} from '../lib/api'

type LoginDestination = 'dashboard' | 'select-company'

type AuthContextValue = {
  user: ApiUser | null
  companies: ApiCompany[]
  activeCompany: ApiCompany | null
  loading: boolean
  canManage: boolean
  login: (email: string, senha: string) => Promise<LoginDestination>
  selectCompany: (empresaId: string) => Promise<ApiCompany>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [companies, setCompanies] = useState<ApiCompany[]>([])
  const [activeCompany, setActiveCompany] = useState<ApiCompany | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    async function restore() {
      if (!getAccessToken()) {
        setLoading(false)
        return
      }

      try {
        const data = await api.get<MeResponse>('/api/auth/me')
        if (!alive) return
        setUser(data.user)
        setCompanies(data.companies)
        setActiveCompany(data.activeCompany)
      } catch {
        clearSessionTokens()
      } finally {
        if (alive) setLoading(false)
      }
    }

    restore()
    return () => {
      alive = false
    }
  }, [])

  const selectCompany = useCallback(async (empresaId: string) => {
    const data = await api.post<{ accessToken: string; refreshToken: string; activeCompany: ApiCompany }>(
      '/api/auth/select-company',
      { empresaId },
    )
    setSessionTokens(data.accessToken, data.refreshToken)
    setActiveCompany(data.activeCompany)
    return data.activeCompany
  }, [])

  const login = useCallback(async (email: string, senha: string): Promise<LoginDestination> => {
    const data = await api.post<LoginResponse>('/api/auth/login', { email, senha })
    setSessionTokens(data.accessToken, data.refreshToken)
    setUser(data.user)
    setCompanies(data.companies)

    if (data.companies.length === 1) {
      await selectCompany(data.companies[0].id)
      return 'dashboard'
    }

    setActiveCompany(null)
    return 'select-company'
  }, [selectCompany])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout', {})
    } catch {
      // Sessão é stateless; seguimos com a limpeza local.
    }
    clearSessionTokens()
    setUser(null)
    setCompanies([])
    setActiveCompany(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    companies,
    activeCompany,
    loading,
    canManage: activeCompany?.papel === 'ADMIN' || activeCompany?.papel === 'GESTOR',
    login,
    selectCompany,
    logout,
  }), [user, companies, activeCompany, loading, login, selectCompany, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
