import { mockSongs } from '../mocks/songs.js'

// ESTO LUEGO SE CAMBIA CON LA BASE DE DATOS
// GET /api/v1/songs, GET /api/v1/songs/:id
// GET /api/v1/songs?search=&page=&pageSize=  (TS-07)

export const listSongs = async () => mockSongs

export const getSongById = async (id) =>
  mockSongs.find((song) => song.id === id) ?? null

// Tamaño de página para búsquedas. El catálogo mock tiene 8 canciones, así que
// un valor chico hace visible la paginación. Con backend real pasa a ser el
// pageSize de la query.
export const SEARCH_PAGE_SIZE = 4

// Campos por los que busca `searchSongs`, en el orden de prioridad del mock.
const SEARCHABLE_FIELDS = ['title', 'artist', 'album', 'genre']

// Normaliza a minúsculas y sin acentos, así "electronica" encuentra
// "Electrónica" y "pape" encuentra "Paper". Mismo criterio que usará el
// endpoint real cuando exista (la búsqueda del backend no suele ser accent-insensitive).
function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function songMatches(song, term) {
  return SEARCHABLE_FIELDS.some((field) => normalize(song[field]).includes(term))
}

/**
 * Busca canciones por título, artista, álbum o género, paginadas.
 *
 * Con query vacío devuelve el catálogo completo paginado, que es lo que la
 * pantalla muestra antes de que el usuario escriba nada.
 *
 * @returns {Promise<{items: object[], total: number, page: number, pageSize: number, totalPages: number}>}
 *   La forma es un objeto y no un array plano porque la paginación necesita
 *   saber el total para dibujar los números de página. Cuando exista backend,
 *   esta es la forma que se espera del endpoint de búsqueda.
 */
export const searchSongs = async (query, page = 1, pageSize = SEARCH_PAGE_SIZE) => {
  const term = normalize(query).trim()
  const found = term ? mockSongs.filter((song) => songMatches(song, term)) : mockSongs

  const total = found.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  // Si piden una página fuera de rango se cae a la última con contenido, para
  // que el frontend nunca reciba una página vacía sin avisar.
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const start = (currentPage - 1) * pageSize

  return {
    items: found.slice(start, start + pageSize),
    total,
    page: currentPage,
    pageSize,
    totalPages,
  }
}