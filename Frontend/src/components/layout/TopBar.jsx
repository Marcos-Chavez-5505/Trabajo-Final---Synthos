import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import searchIcon from '../../assets/search.svg'

/**
 * Input de búsqueda global. Escribe en la URL de /buscar (?q=) para que la
 * búsqueda sea compartible y el back del browser funcione. TS-08 va a sumar
 * personas y salas a esta misma pantalla.
 */
export default function TopBar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // El input es controlled desde la URL: si ?q= cambia (por ejemplo al navegar
  // atrás) el input se entera sin duplicar estado.
  const query = searchParams.get('q') ?? ''
  const [text, setText] = useState(query)
  const [lastQuery, setLastQuery] = useState(query)

  // Sincronizar estado con la URL se hace durante el render y no en un efecto:
  // así no hay un render extra en cascada.
  if (query !== lastQuery) {
    setLastQuery(query)
    setText(query)
  }

  const submit = (event) => {
    event.preventDefault()

    const query = text.trim()

    navigate(query ? `/buscar?q=${encodeURIComponent(query)}` : '/buscar')
  }

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <div className="flex gap-2">
        {/* TODO(agente): navegación atrás/adelante (historial de router) */}
        <button type="button" className="rounded-full Volume px-2 py-1 Button">←</button>
        <button type="button" className="rounded-full Volume px-2 py-1 Button">→</button>
      </div>

      <form onSubmit={submit} role="search" className="w-72">
        <div className="Volume flex items-center gap-2 rounded-full px-4 py-2">
          <img src={searchIcon} alt="" aria-hidden="true" className="h-4 w-4 shrink-0" />
          <input
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Buscar canciones"
            aria-label="Buscar canciones"
            className="text-foreground TextRegluar placeholder-muted-foreground/60 w-full bg-transparent outline-none"
          />
        </div>
      </form>
    </header>
  )
}