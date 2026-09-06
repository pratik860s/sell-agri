import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [storage, setStorage] = useState(null)
  const [checking, setChecking] = useState(true)

  const check = useCallback(async (signal) => {
    try {
      const res = await api.me(signal)
      setUser(res.username)
      setStorage(res.storage)
    } catch {
      setUser(null)
      setStorage(null)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    check(controller.signal)
    return () => controller.abort()
  }, [check])

  const login = useCallback(async (username, password) => {
    await api.login(username, password)
    await check()
  }, [check])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      setUser(null)
      setStorage(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, storage, checking, login, logout, recheck: check }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
