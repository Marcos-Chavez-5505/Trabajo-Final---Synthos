export default function TopBar() {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <div className="flex gap-2">
        {/* TODO(agente): navegación atrás/adelante (historial de router) */}
        <button className="rounded-full Volume px-2 py-1 Button">←</button>
        <button className="rounded-full Volume px-2 py-1 Button">→</button>
      </div>

      <div className="w-72">
        {/* TODO(agente): conectar a SearchSongs/SearchPeople (TS-07, TS-08) */}
        <input
          type="search"
          placeholder="Search"
          className="w-full rounded-full px-4 py-2 Volume TextRegluar placeholder-muted-foreground/60 outline-none"
        />
      </div>
    </header>
  )
}