import { Navigate } from 'react-router-dom'
import LoadingScreen from '../components/ui/LoadingScreen.jsx'
import useAuth from '../hooks/useAuth.js'

export default function PublicOnly({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (user) {
    return <Navigate to="/home" replace />
  }

  return children
}