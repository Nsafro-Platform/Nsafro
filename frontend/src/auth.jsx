import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .me()
      .then((data) => {
        if (!cancelled) setUser(data.user)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      ready,
      isAdmin: user?.role === 'admin',
      async login(email, password) {
        const data = await api.login({ email, password })
        setUser(data.user)
        return data.user
      },
      async register(email, password, fullName) {
        const data = await api.register({ email, password, fullName })
        setUser(data.user)
        return data.user
      },
      async logout() {
        await api.logout()
        setUser(null)
      },
      // Called after a non-cookie-based sign-in (e.g. Google) to pick up the
      // session cookie that the fetch already set.
      async refresh() {
        try {
          const data = await api.me()
          setUser(data.user)
          return data.user
        } catch {
          return null
        }
      },
    }),
    [user, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
