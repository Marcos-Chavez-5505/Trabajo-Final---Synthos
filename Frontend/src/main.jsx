import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import AuthProvider from './context/AuthContext.jsx'
import PlayerProvider from './context/PlayerContext.jsx'
import { configureApi } from './services/api.js'

// Adaptador web de storage: envuelve localStorage en Promise (contrato async).
const webStorage = {
  getItem: async (key) => localStorage.getItem(key),
  setItem: async (key, value) => localStorage.setItem(key, value),
  removeItem: async (key) => localStorage.removeItem(key),
}

configureApi({
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  storage: webStorage,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <PlayerProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PlayerProvider>
    </AuthProvider>
  </StrictMode>,
)
