import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { getUserIdFromToken } from '../utils/jwt'

type User = {
  id: number
  name: string
  email: string
}

type LoginInput = { email: string; password: string }
type RegisterInput = { name: string; email: string; password: string }

type AuthContextValue = {
  token: string | null
  user: User | null
  userId: number | null
  isAuthenticated: boolean
  login: (payload: LoginInput) => Promise<void>
  register: (payload: RegisterInput) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user')
    return saved ? (JSON.parse(saved) as User) : null
  })

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ status?: number }>).detail
      if (detail?.status === 401) {
        logout()
      }
    }

    window.addEventListener('api:error', handler)
    return () => window.removeEventListener('api:error', handler)
  }, [logout])

  const login = async (payload: LoginInput) => {
    const response = await api.post('/api/auth/login', payload)
    const authToken = response.data.token as string
    const authUser = response.data.user as User

    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(authUser))

    setToken(authToken)
    setUser(authUser)
  }

  const register = async (payload: RegisterInput) => {
    await api.post('/api/auth/register', payload)
  }

  const value = useMemo(
    () => ({
      token,
      user,
      userId: user?.id ?? getUserIdFromToken(token),
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
    }),
    [token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
