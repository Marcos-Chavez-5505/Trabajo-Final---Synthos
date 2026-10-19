import { io } from 'socket.io-client'
import { getAuthToken } from './api.js'

// Canal de tiempo real de las salas (B11).
//
// El backend autentica el handshake con el JWT y deja a cada socket en su canal
// `user:<id>`; entrar a una sala es un `join-room` explícito, que el servidor
// valida contra `room_member` antes de sumar el socket a `room:<id>`.
//
// Los clientes SOLO escuchan: el estado no cambia por el socket, cambia por los
// endpoints REST (`POST /rooms/:id/playback`, etc.) y el servidor lo emite. Por
// eso acá no hay `emit` de acciones: los dos `emit` que existen son `join-room` y
// `leave-room`, que son suscripción, no mutación.
//
// El estado de reproducción vive en memoria del servidor, así que esto exige un
// backend Node persistente: en un despliegue serverless el handshake no se
// sostiene.

let socket = null

/** Suscriptores por evento, para poder desuscribirse sin tocar los demás. */
const listeners = new Map()

// Canales de sala a los que este cliente se unió, para volver a entrar a ellos
// después de una reconexión: Socket.IO crea un socket nuevo en cada reconexión y
// eso implica volver a hacer `join-room` (si no, la sala deja de emitir).
const joinedChannels = new Set()

/**
 * Registra un handler para un evento del servidor y lo engancha al socket si ya
 * hay conexión.
 *
 * El handler se guarda en un registro aparte del socket para que cambiar de
 * pantalla no requiera abrir ni cerrar conexiones: todas comparten la misma.
 *
 * @param {string} event Uno de los eventos de sala que emite el backend.
 * @param {(payload: any) => void} handler
 * @returns {() => void} Función para desuscribirse.
 */
export function subscribeToRoomEvent(event, handler) {
  if (!listeners.has(event)) listeners.set(event, new Set())

  const handlers = listeners.get(event)

  handlers.add(handler)
  socket?.on(event, handler)

  return () => {
    handlers.delete(handler)
    socket?.off(event, handler)
  }
}

/**
 * Abre la conexión si no está abierta y la devuelve.
 *
 * Es idempotente a propósito: varias pantallas pueden pedir el socket y todas
 * comparten la misma conexión, así que no se abre una por pantalla.
 *
 * @returns {import('socket.io-client').Socket|null} `null` si no hay sesión.
 */
export function connectSocket() {
  if (socket) return socket

  const token = getAuthToken()

  if (!token) return null

  // Sin URL: el cliente pega al mismo origen del frontend, que en dev lo
  // redirige el proxy de Vite a `localhost:3000` (por eso el `ws: true`).
  socket = io({
    auth: { token },
    transports: ['websocket', 'polling'],
  })

  // Los suscriptores que se registraron antes de que existiera la conexión
  // también tienen que escucharla.
  listeners.forEach((handlers, event) => {
    handlers.forEach((handler) => socket.on(event, handler))
  })

  // Al reconectar, el socket es otro: hay que volver a entrar a los canales de
  // sala, porque `join-room` es por conexión y no se recuerda solo.
  socket.on('connect', () => {
    joinedChannels.forEach((roomId) => socket.emit('join-room', roomId))
  })

  return socket
}

/**
 * Entra al canal de una sala. El servidor valida la pertenencia y responde
 * `joined-room` si lo aceptó, o `error` si no.
 *
 * @param {number|string} roomId
 */
export function joinRoomChannel(roomId) {
  const id = Number(roomId)

  joinedChannels.add(id)
  connectSocket()?.emit('join-room', id)
}

/**
 * Sale del canal de la sala. El socket sigue abierto: puede estar en varias
 * pantallas.
 *
 * @param {number|string} roomId
 */
export function leaveRoomChannel(roomId) {
  const id = Number(roomId)

  joinedChannels.delete(id)
  socket?.emit('leave-room', id)
}

/**
 * Cierra la conexión y olvida los suscriptores.
 *
 * La llama el cierre de sesión: dejar el socket vivo con un token viejo sería
 * mandarle eventos a un servidor que ya no lo reconoce.
 */
export function disconnectSocket() {
  if (!socket) return

  socket.removeAllListeners()
  socket.disconnect()
  socket = null
  listeners.clear()
  joinedChannels.clear()
}

/** @returns {import('socket.io-client').Socket|null} */
export function getSocket() {
  return socket
}