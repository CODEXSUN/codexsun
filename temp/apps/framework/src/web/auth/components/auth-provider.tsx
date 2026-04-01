import type { AuthLoginPayload, AuthRegisterPayload, AuthUser } from '@shared/index'
import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useContext,
  useState,
} from 'react'
import { getCurrentUser, login, recoveryLogin, register } from '@/shared/api/client'
import { clearRequestedPath } from '@framework-core/web/auth/lib/navigation-state'

const STORAGE_KEY = 'codexsun-auth-session-v2'

interface AuthSession {
  accessToken: string
  expiresInSeconds: number
  user: AuthUser
}

interface AuthContextValue {
  session: AuthSession | null
  isAuthenticated: boolean
  login: (payload: AuthLoginPayload) => Promise<AuthSession>
  recoveryLogin: (payload: AuthLoginPayload) => Promise<AuthSession>
  register: (payload: AuthRegisterPayload) => Promise<AuthSession>
  refreshUser: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function clearStoredSession() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY)
  }

  clearRequestedPath()
}

function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<AuthSession> | null

    if (
      !parsedValue ||
      typeof parsedValue.accessToken !== 'string' ||
      typeof parsedValue.expiresInSeconds !== 'number' ||
      !parsedValue.user ||
      typeof parsedValue.user !== 'object'
    ) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return parsedValue as AuthSession
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession())

  function resetSession() {
    clearStoredSession()
    setSession(null)
  }

  useEffect(() => {
    if (!session?.accessToken || !session.user || typeof session.user !== 'object') {
      return
    }

    if (typeof session.user.isSuperAdmin === 'boolean') {
      return
    }

    let cancelled = false

    void getCurrentUser(session.accessToken)
      .then((user) => {
        if (cancelled) {
          return
        }

        const nextSession = {
          ...session,
          user,
        } satisfies AuthSession

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
        setSession(nextSession)
      })
      .catch(() => {
        if (!cancelled) {
          resetSession()
        }
      })

    return () => {
      cancelled = true
    }
  }, [session])

  async function handleLogin(payload: AuthLoginPayload) {
    const response = await login(payload)
    const nextSession = {
      accessToken: response.accessToken,
      expiresInSeconds: response.expiresInSeconds,
      user: response.user,
    } satisfies AuthSession

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    return nextSession
  }

  async function handleRecoveryLogin(payload: AuthLoginPayload) {
    const response = await recoveryLogin(payload)
    const nextSession = {
      accessToken: response.accessToken,
      expiresInSeconds: response.expiresInSeconds,
      user: response.user,
    } satisfies AuthSession

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    return nextSession
  }

  async function handleRegister(payload: AuthRegisterPayload) {
    const response = await register(payload)
    const nextSession = {
      accessToken: response.accessToken,
      expiresInSeconds: response.expiresInSeconds,
      user: response.user,
    } satisfies AuthSession

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    return nextSession
  }

  async function refreshUser() {
    if (!session?.accessToken) {
      return
    }

    try {
      const user = await getCurrentUser(session.accessToken)
      const nextSession = {
        ...session,
        user,
      } satisfies AuthSession

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
      setSession(nextSession)
    } catch (error) {
      resetSession()
      throw error
    }
  }

  function logout() {
    resetSession()
  }

  const value = {
    session,
    isAuthenticated: Boolean(session),
    login: handleLogin,
    recoveryLogin: handleRecoveryLogin,
    register: handleRegister,
    refreshUser,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}

