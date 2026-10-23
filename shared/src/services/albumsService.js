import { get } from './api.js'
import { toSong } from './songsService.js'

// Contrato de la API real (ver docs/ESPECIFICACIONES-BACKEND.md):
//   GET /api/songs/search?type=albums -> { items, total, page, pageSize, totalPages }
//   GET /api/albums/:id                 -> { status, album }
//
// El listado de álbumes no tiene recurso propio: es la misma búsqueda paginada de
// canciones con `type=albums`, que devuelve álbum + `_count.songs` en vez de
// canciones. El mapeo vive acá y no en los componentes (reglas 5 y 6 de AGENTS.md).

export const ALBUMS_PAGE_SIZE = 12

// El enum `album_type` de la base, con el texto que muestra la UI.
export const ALBUM_TYPE_LABELS = { single: 'Sencillo', ep: 'EP', album: 'Álbum' }

/**
 * Convierte un álbum del backend a la forma que usa la app.
 *
 * - `artist` viene anidado y la app lo usa como string en las cards.
 * - `_count.songs` pasa a `songsCount`, que es lo que se muestra bajo el título.
 * - `releaseDate` llega como fecha ISO completa y la app solo muestra el año.
 */
export function toAlbum(raw) {
  if (!raw) return null

  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    coverUrl: raw.coverUrl ?? null,
    releaseYear: raw.releaseDate ? new Date(raw.releaseDate).getFullYear() : null,
    artistId: raw.artist?.id ?? null,
    artistName: raw.artist?.name ?? null,
    artistPictureUrl: raw.artist?.pictureUrl ?? null,
    songsCount: raw._count?.songs ?? 0,
  }
}

export async function listAlbums(query = '', page = 1, pageSize = ALBUMS_PAGE_SIZE, { signal } = {}) {
  const term = String(query ?? '').trim()

  const data = await get('/songs/search', {
    params: { query: term, type: 'albums', page, pageSize },
    signal,
  })

  return {
    items: (data?.items ?? []).map(toAlbum),
    total: data?.total ?? 0,
    page: data?.page ?? page,
    pageSize: data?.pageSize ?? pageSize,
    totalPages: data?.totalPages ?? 1,
  }
}

export async function getAlbumById(albumId) {
  const data = await get(`/albums/${albumId}`)

  return toAlbumDetail(data?.album)
}

/**
 * El detalle trae las canciones ya resueltas con la misma forma que consume el
 * reproductor, así que se apoya en el mapper de `songsService` en vez de duplicar
 * la traducción del contrato. Esas canciones no vienen con `album` (ya están
 * dentro de un álbum, es la página), así que ahí `album` queda en `null`.
 */
function toAlbumDetail(raw) {
  if (!raw) return null

  return {
    ...toAlbum(raw),
    songs: (raw.songs ?? []).map(toSong),
    songsCount: raw.songs?.length ?? 0,
  }
}
