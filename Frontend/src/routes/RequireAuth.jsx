import { Navigate, useLocation } from 'react-router-dom'
import LoadingScreen from '../components/ui/LoadingScreen.jsx'
import useAuth from '../hooks/useAuth.js'

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}