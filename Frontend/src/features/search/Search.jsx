import { useSearchParams } from 'react-router-dom'
import SearchPeople from './SearchPeople.jsx'
import SearchSongs from './SearchSongs.jsx'

/**
 * Contenedor de /buscar: decide qué pantalla mostrar según `?tipo=`.
 *
 * Cada subpantalla tiene su propio encabezado y sus resultados, pero comparten
 * la query (`?q=`) y la página (`?page=`) de la URL. Por eso el interruptor va
 * acá y no dentro de `SearchSongs`: así ninguna de las dos necesita saber de la
 * otra.
 *
 * Sin `?tipo=` (o con uno desconocido) abre en canciones, que es lo que espera
 * el input global de `TopBar`.
 */
export default function Search() {
  const [searchParams] = useSearchParams()
  const tipo = searchParams.get('tipo')

  return tipo === 'personas' ? <SearchPeople /> : <SearchSongs />
}
