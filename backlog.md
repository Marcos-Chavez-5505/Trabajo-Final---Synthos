
TS-06 (reproductor) entregado. Los 4 criterios de aceptación quedaron en [x].
Estado global — src/context/PlayerContext.jsx (provider global en main.jsx, junto a AuthProvider), con context/playerContext.js + hooks/usePlayer.js siguiendo el mismo patrón que auth:

- Un solo  HTML5 oculto; isPlaying es la única fuente de verdad, con .catch por si el navegador bloquea autoplay.
- queue + index (la canción actual es queue[index], derivada → no puede desincronizarse), currentTime, duration, shuffle, repeat.
- next() con shuffle aleatorio o secuencial; al final del catálogo repeat: 'list' vuelve al inicio y off detiene. previous(): >3s reinicia, si no va al anterior con wrap. repeat cicla off → track → list → off.
  Presentación (mismo estado en ambas barras):
- player/ProgressBar.jsx — role="slider", seek por click y arrastre (setPointerCapture), teclado (←/→ 5s, Home), formato de tiempo en lib/formatTime.js.
- player/PlayerControls.jsx — play/pause, prev, next, shuffle, repeat (consume usePlayer() directo, sin prop drilling).
- player/PlayerBar.jsx (desktop, montado en AppLayout) y layout/MiniPlayerBar.jsx (mobile, ya no es shell).
  Datos — mocks/songs.js con 8 tracks ficticios apuntando a MP3 públicos de SoundHelix (verifiqué que los 10 responden 200 audio/mpeg, así que el audio es real, no simulado); songsService.js expone listSongs() / getSongById(id) async consumiendo el mock.
  Dos decisiones que conviene que revises:
- La cola inicial es el catálogo completo para que el reproductor sea usable hoy sin cards; playSongs(songs, startIndex) queda como entrada para TS-07/TS-09. Está anotado con TODO(agente).
- Verifiqué con smoke test de Node lo que es testeable sin browser (formatDuration en todos los bordes, listSongs/getSongById). La parte que no pude probar es el comportamiento real del  (play, ended, seek por arrastre) — eso hay que abrirlo en el navegador. Build y lint pasan; los 3 warnings siguen siendo los preexistentes de shadcn.
  Siguiente del plan: TS-07 (buscar canciones) o TS-08 (buscar personas), ambos dependen de lo que acabo de dejar listo.




Sí, sirve mucho. src/styles/styles.css tiene los tokens y sus valores coinciden con los del CSS compilado (Volume #373038, Wall #605468, Fucsia #ef2f62, Lighter #f4f0f9, Surface #1e1e1e, SurfaceLight #2a2a2c, Shadow #453a4a, Light #c6bed3, escala TextRegluar/TextMedium/TextTiny/TextLarge/Header1-4/Button, Elevation1). Con eso no necesito reconstruir nada.
Pero el archivo deja 3 huecos que sí hay que resolver:

1. No lo importa nadie. main.jsx solo importa ./index.css, e index.css no lo importa. Hoy las clases están muertas.
2. Falta el bloque :root de shadcn. styles.css no define --background/--foreground/--card/--popover/--primary/--secondary/--muted ni los --sidebar* (sí estaban en el CSS compilado). Sin eso, ui/sidebar.tsx y el Sidebar de AppLayout se renderizan sin estilo.
3. Roboto no está cargado. Los tokens declaran font-family: Roboto, pero index.html solo trae Space Grotesk (y index.css pone Inter, que tampoco se carga). Hoy todo el texto del player cae a sans-serif del sistema.
   Paso 0 revisado

- src/styles/styles.css → quitarle el @import "tailwindcss" (línea 1) y dejar que src/index.css la cargue: @import "tailwindcss"; @import "./styles/styles.css"; en ese orden. Un solo entrypoint, sin duplicar la importación de Tailwind.
- Agregar el bloque :root de shadcn (--background, --primary, --card, --popover, --muted, --secondary + los 8 --sidebar*) al final de styles.css, con los valores que ya estaban compilados (--primary: #ef2f62, --secondary: #373038, --card/#2a2a2c, --sidebar…).
- main.jsx: AuthProvider > PlayerProvider > BrowserRouter > App; App.jsx delegando en routes/AppRoutes.jsx; borrar pages/Login y pages/Register viejos.
- Los pasos 1-7 (mock source, PlayerBar ancho completo con expand.svg, AppLayout columna + padding del Sidebar, PlayerControls con play en Lighter invertido y botón Siguiente, MiniPlayerBar con play+Siguiente, showLabels en ProgressBar) quedan igual.
  Confirmaciones

1. ¿Arranco por el paso 0? Sin él el reproductor no se ve.
2. Fuente: ¿unifico en Space Grotesk (lo que ya está cargado, cambio los tokens) o agrego el link de Roboto (lo que los tokens declaran)?
3. Labels de tiempo en mobile: la referencia mobile no los tiene. ¿Solo desktop?
4. Botón expandir: ¿visual con expand.svg + TODO, o implemento el player expandido/plegado?
