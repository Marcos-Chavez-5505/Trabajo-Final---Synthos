const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString()

/**
 * Datos de ejemplo de la bandeja de notificaciones.
 *
 * La forma imita el DTO que va a devolver el backend (actor + target + estado
 * de lectura) para que reemplazar este archivo por el service real no obligue a
 * reescribir la UI. Vive dentro de la feature y no en `mocks/` porque esa
 * carpeta ya no existe en el repo.
 */
export const mockNotifications = [
  {
    id: 1,
    type: 'follow',
    isRead: false,
    createdAt: minutesAgo(4),
    actor: { id: 12, username: 'mica', avatarUrl: null },
  },
  {
    id: 2,
    type: 'recommendation',
    isRead: false,
    createdAt: minutesAgo(27),
    actor: { id: 24, username: 'tomi', avatarUrl: null },
    song: { id: 31, title: 'Nocturno', artist: 'Lara Gris' },
  },
  {
    id: 3,
    type: 'playlist_invitation',
    isRead: false,
    createdAt: minutesAgo(95),
    actor: { id: 36, username: 'sofi', avatarUrl: null },
    playlist: { id: 14, name: 'Ruta 40' },
  },
  {
    id: 4,
    type: 'follow',
    isRead: true,
    createdAt: minutesAgo(60 * 20),
    actor: { id: 43, username: 'juli', avatarUrl: null },
  },
  {
    id: 5,
    type: 'recommendation',
    isRead: true,
    createdAt: minutesAgo(60 * 30),
    actor: { id: 51, username: 'nacho', avatarUrl: null },
    song: { id: 78, title: 'Domingo gris', artist: 'Los Cardos' },
  },
  {
    id: 6,
    type: 'playlist_invitation',
    isRead: true,
    createdAt: minutesAgo(60 * 24 * 3),
    actor: { id: 62, username: 'cami', avatarUrl: null },
    playlist: { id: 22, name: 'Fondo de tardes' },
  },
]
