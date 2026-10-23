import { useContext } from 'react'
import { AuthContext } from '../context/authContext.js'

export default function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  }
  return context
}