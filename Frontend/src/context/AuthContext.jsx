import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContext.js'
import { setUnauthorizedHandler } from '../services/api.js'
import {
  clearSession,
  getCurrentUser,
  loginUser as loginService,
  logoutUser as logoutService,
  registerUser as registerService,
} from '../services/authService.js'
import { updateProfile as updateProfileService } from '../services/usersService.js'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Cuando un request autenticado recibe 401, el token guardado ya no vale:
  // se limpia la sesión y `RequireAuth` redirige a /login al ver `user` null.
  // No se navega desde acá porque el provider está fuera del Router.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession()
      setUser(null)
    })

    return () => setUnauthorizedHandler(null)
  }, [])

  useEffect(() => {
    let active = true

    getCurrentUser()
      .then((current) => {
        if (active) setUser(current)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const register = useCallback(async (data) => {
    const created = await registerService(data)
    setUser(created.user ?? null)
    return created
  }, [])

  const login = useCallback(async (email, password) => {
    const logged = await loginService(email, password)
    setUser(logged.user ?? null)
    return logged
  }, [])

  const logout = useCallback(async () => {
    await logoutService()
    setUser(null)
  }, [])

  const updateProfile = useCallback(
    async (data) => {
      if (!user) {
        throw new Error('No hay sesión activa.')
      }
      const updated = await updateProfileService(data)
      setUser(updated)
      return updated
    },
    [user],
  )

  const value = useMemo(
    () => ({ user, loading, register, login, logout, updateProfile }),
    [user, loading, register, login, logout, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}