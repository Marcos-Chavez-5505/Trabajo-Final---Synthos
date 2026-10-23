import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // El backend corre en el 3000 y la app en el 5173, así que `/api` se redirige
  // en dev. En las llamadas se usan rutas relativas y nunca el host del backend:
  // el mismo build funciona contra un reverse proxy en producción.
  server: {
    fs: {
      allow: ['..']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      // El socket de las salas (B11) se conecta al mismo origen del frontend, así
      // que en dev también tiene que pasar por el proxy. Sin `ws: true` el
      // handshake de Socket.IO falla y la sala nunca se sincroniza.
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true
      }
    }
  }
})
