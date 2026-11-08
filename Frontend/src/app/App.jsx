import AppRoutes from '@/routes/AppRoutes.jsx'
import usePlayerWebEffects from '@/features/player/hooks/usePlayerWebEffects.js'

function App() {
  usePlayerWebEffects()
  return <AppRoutes />
}

export default App
