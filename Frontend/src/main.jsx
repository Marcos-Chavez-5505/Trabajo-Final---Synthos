import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider, PlayerProvider } from '@synthos/shared'
import { configureApi } from '@synthos/shared'
import { createHtmlAudioMotor } from './lib/audioMotor.js'

// Motor de audio web (HTMLAudioElement) inyectado al PlayerProvider compartido.
const audioElement = document.createElement('audio')
audioElement.preload = 'metadata'
audioElement.className = 'hidden'
document.body.appendChild(audioElement)
const audioMotor = createHtmlAudioMotor(audioElement)

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
      <PlayerProvider motor={audioMotor}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PlayerProvider>
    </AuthProvider>
  </StrictMode>,
)
