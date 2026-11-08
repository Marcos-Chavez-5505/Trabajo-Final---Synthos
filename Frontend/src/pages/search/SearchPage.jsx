import { useSearchParams } from 'react-router-dom'
import SearchAlbums from '@/features/search/components/SearchAlbums.jsx'
import SearchPeople from '@/features/search/components/SearchPeople.jsx'
import SearchSongs from '@/features/search/components/SearchSongs.jsx'

/**
 * Contenedor de /buscar: decide qué pantalla mostrar según `?tipo=`.
 *
 * Cada subpantalla tiene su propio encabezado y sus resultados, pero comparten
 * la query (`?q=`) y la página (`?page=`) de la URL. Por eso el interruptor va
 * acá y no dentro de `SearchSongs`: así ninguna de las tres necesita saber de las
 * otras. Los valores de `tipo` son los de `SearchTabs`.
 *
 * Sin `?tipo=` (o con uno desconocido) abre en canciones, que es lo que espera
 * el input global de `TopBar`.
 */
export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const tipo = searchParams.get('tipo')

  if (tipo === 'personas') return <SearchPeople />
  if (tipo === 'albumes') return <SearchAlbums />

  return <SearchSongs />
}
