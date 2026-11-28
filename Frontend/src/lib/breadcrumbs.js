import { generatePath, matchPath } from 'react-router-dom'

/**
 * Mapa central de migas. La app usa <BrowserRouter> + <Routes>, sin data router,
 * así que no existen `useMatches()` ni `handle`: la jerarquía se declara acá.
 *
 * Cada entrada define su patrón (tal cual en `routes/AppRoutes.jsx`), su padre y
 * su label. Las rutas con `:id` son `dinamicas`: su label lo publica la página
 * que ya cargó el dato (ver `hooks/useBreadcrumbLabel.js`) y, mientras tanto,
 * se muestra `fallback`.
 */
export const RUTAS_BREADCRUMB = [
  { path: '/home', label: 'Home' },
  { path: '/perfil', parent: '/home', label: 'Mi perfil' },
  { path: '/perfil/seguidores', parent: '/perfil', label: 'Seguidores' },
  { path: '/perfil/siguiendo', parent: '/perfil', label: 'Siguiendo' },
  { path: '/profile/:id', parent: '/home', dinamico: true, fallback: 'Perfil' },
  { path: '/profile/:id/seguidores', parent: '/profile/:id', label: 'Seguidores' },
  { path: '/profile/:id/siguiendo', parent: '/profile/:id', label: 'Siguiendo' },
  { path: '/playlists', parent: '/home', label: 'Playlists' },
  { path: '/playlists/:id', parent: '/playlists', dinamico: true, fallback: 'Playlist' },
  { path: '/salas', parent: '/home', label: 'Salas' },
  { path: '/salas/:id', parent: '/salas', dinamico: true, fallback: 'Sala' },
  { path: '/albums', parent: '/home', label: 'Álbumes' },
  { path: '/albums/:id', parent: '/albums', dinamico: true, fallback: 'Álbum' },
  { path: '/artistas', parent: '/home', label: 'Artistas' },
  { path: '/artistas/:id', parent: '/artistas', dinamico: true, fallback: 'Artista' },
  { path: '/animo', parent: '/home', label: 'Ánimo' },
  { path: '/buscar', parent: '/home', label: 'Búsqueda' },
  { path: '/notificaciones', parent: '/home', label: 'Notificaciones' },
]

/**
 * Arma la cadena de migas de `pathname` (solo el path, sin query ni hash).
 *
 * `labelsDinamicos` es `{ [patron]: label }` publicado por las páginas:
 * - `undefined` → la página todavía está cargando: `{ cargando: true }`.
 * - `null` o vacío → no hay dato: se usa el `fallback` de la ruta.
 * - string → ese label.
 *
 * Devuelve `[]` si la ruta no está en el mapa. La última miga no lleva `to`.
 */
export function buildBreadcrumbs(pathname, labelsDinamicos = {}) {
  const hoja = RUTAS_BREADCRUMB.find((ruta) =>
    matchPath({ path: ruta.path, end: true }, pathname)
  )
  if (!hoja) return []

  const params = matchPath({ path: hoja.path, end: true }, pathname)?.params ?? {}

  // Subir por `parent` hasta la raíz y revertir el orden.
  const cadena = []
  let actual = hoja
  while (actual) {
    cadena.unshift(actual)
    actual = actual.parent
      ? RUTAS_BREADCRUMB.find((ruta) => ruta.path === actual.parent)
      : null
  }

  return cadena.map((ruta, index) => {
    const esUltima = index === cadena.length - 1
    const miga = {
      patron: ruta.path,
      label: ruta.label,
      to: generatePath(ruta.path, params),
    }

    if (ruta.dinamico) {
      const valor = labelsDinamicos[ruta.path]

      if (valor === undefined) {
        miga.label = ruta.fallback
        miga.cargando = true
      } else {
        miga.label = valor || ruta.fallback
      }
    }

    if (esUltima) delete miga.to

    return miga
  })
}
