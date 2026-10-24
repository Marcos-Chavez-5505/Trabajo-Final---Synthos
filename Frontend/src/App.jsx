import AppRoutes from './routes/AppRoutes.jsx'
import usePlayerWebEffects from './hooks/usePlayerWebEffects.js'

function App() {
  usePlayerWebEffects()
  return <AppRoutes />
}

export default App
