import { mockSongs } from '../mocks/songs.js'

// ESTO LUEGO SE CAMBIA CON LA BASE DE DATOS
// GET /api/v1/songs, GET /api/v1/songs/:id

export const listSongs = async () => mockSongs

export const getSongById = async (id) =>
  mockSongs.find((song) => song.id === id) ?? null
