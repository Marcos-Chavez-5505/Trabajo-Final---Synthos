import { get } from './api.js'
import { toAlbum } from './albumsService.js'

// Contrato de la API real (ver docs/ESPECIFICACIONES-BACKEND.md):
//   GET /api/artists?query=&page=&pageSize= -> { items, total, page, pageSize, totalPages }
//   GET /api/artists/:id                     -> { status, artist } con albums[]
//
// El listado trae el conteo de álbumes y canciones. El detalle agrega `albums[]`,
// que se mapea con `toAlbum()` para reutilizar el contrato de los discos.

export const ARTISTS_PAGE_SIZE = 18

/** Convierte un artista del backend a la forma que usa la app. */
export function toArtist(raw) {
  if (!raw) return null

  return {
    id: raw.id,
    name: raw.name,
    pictureUrl: raw.pictureUrl ?? null,
    albumsCount: raw._count?.albums ?? raw.albums?.length ?? 0,
    songsCount: raw._count?.songs ?? 0,
  }
}

/**
 * Artistas del catálogo, paginados y ordenados por nombre.
 *
 * @param {string} [query] Filtro opcional por nombre.
 * @param {number} [page]
 * @param {number} [pageSize]
 * @param {{signal?: AbortSignal}} [options]
 */
export async function listArtists(
  query = '',
  page = 1,
  pageSize = ARTISTS_PAGE_SIZE,
  { signal } = {},
) {
  const term = String(query ?? '').trim()

  const data = await get('/artists', {
    params: { query: term, page, pageSize },
    signal,
  })

  return {
    items: (data?.items ?? []).map(toArtist),
    total: data?.total ?? 0,
    page: data?.page ?? page,
    pageSize: data?.pageSize ?? pageSize,
    totalPages: data?.totalPages ?? 1,
  }
}

/** Artista con todos sus álbumes. */
export async function getArtistById(artistId) {
  const data = await get(`/artists/${artistId}`)

  return toArtistDetail(data?.artist)
}

function toArtistDetail(raw) {
  if (!raw) return null

  return {
    ...toArtist(raw),
    albums: (raw.albums ?? []).map(toAlbum),
  }
}
