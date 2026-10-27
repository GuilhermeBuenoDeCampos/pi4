const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3333').replace(/\/$/, '')
const ACCESS_KEY = 'infinity.access'
const REFRESH_KEY = 'infinity.refresh'

export type ApiUser = {
  id: string
  nome: string
  email: string
  telefone: string | null
}

export type ApiCompany = {
  id: string
  nomeFantasia: string
  razaoSocial: string
  cnpj: string | null
  papel: 'ADMIN' | 'GESTOR' | 'INSTRUTOR' | 'COLABORADOR'
  status: 'ATIVO' | 'INATIVO' | 'CONVIDADO'
  cargo: string | null
}

export type LoginResponse = {
  user: ApiUser
  companies: ApiCompany[]
  accessToken: string
  refreshToken: string
  requiresCompanySelection: boolean
}

export type MeResponse = {
  user: ApiUser
  companies: ApiCompany[]
  activeCompany: ApiCompany | null
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getAccessToken() {
  return window.localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken() {
  return window.localStorage.getItem(REFRESH_KEY)
}

export function setSessionTokens(accessToken: string, refreshToken: string) {
  window.localStorage.setItem(ACCESS_KEY, accessToken)
  window.localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearSessionTokens() {
  window.localStorage.removeItem(ACCESS_KEY)
  window.localStorage.removeItem(REFRESH_KEY)
}

function extractMessage(data: unknown, fallback: string) {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return fallback
}

async function tryRefresh() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (!response.ok) throw new Error('refresh failed')

    const data = await response.json() as { accessToken: string; refreshToken: string }
    setSessionTokens(data.accessToken, data.refreshToken)
    return true
  } catch {
    clearSessionTokens()
    return false
  }
}

async function request<T>(path: string, options: RequestInit = {}, canRetry = true): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (response.status === 401 && canRetry && getRefreshToken()) {
    const refreshed = await tryRefresh()
    if (refreshed) return request<T>(path, options, false)
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(extractMessage(data, 'Não foi possível concluir a operação.'), response.status)
  }

  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
}
