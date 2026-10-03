// Semilla de playlists mock. La consume solo `playlistsService`.
//
// Una playlist guarda `songIds`, no canciones enteras: las canciones son datos
// del backend (`/api/songs/:id`) y duplicar el objeto acá los dejaría viejos en
// el primer cambio de título o de carátula. El detalle de la playlist resuelve
// los ids con `songsService`.
//
// Los ids son reales del catálogo sembrado por el backend (ver
// `Backend/prisma/data/songs.json`), así la pantalla de detalle reproduce audio
// de verdad en vez de un placeholder.
//
// La playlist "Mis Favoritos" NO va sembrada a propósito: el criterio de TS-09
// pide que se autogeneré al marcar la primera canción favorita, y si estuviera en
// la semilla no se podría comprobar. `playlistsService` la crea sola.
export const mockPlaylists = [
  {
    id: 'pl-rock',
    ownerId: 'u1',
    name: 'Ruido temprano',
    description: 'Para las primeras horas del día.',
    isFavorites: false,
    songIds: [43886, 306166],
    createdAt: '2026-09-20T18:00:00.000Z',
  },
  {
    id: 'pl-estudio',
    ownerId: 'u1',
    name: 'Con los auriculares puestos',
    description: 'Sesiones largas, poco ambiente.',
    isFavorites: false,
    songIds: [25706, 26747],
    createdAt: '2026-09-24T12:30:00.000Z',
  },
  {
    id: 'pl-juan',
    ownerId: 'u2',
    name: 'Sintetizadores',
    description: 'Playlist privada de Juan, invisible para el resto.',
    isFavorites: false,
    songIds: [26747, 81740],
    createdAt: '2026-09-25T09:15:00.000Z',
  },
]
