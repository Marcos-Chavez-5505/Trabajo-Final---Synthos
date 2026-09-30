# Synthos — Frontend

## Reproductor

Un único `PlayerContext` global maneja un `<audio>` HTML5 oculto. `PlayerBar` (desktop) y
`MiniPlayerBar` (mobile) son solo presentación de ese mismo estado.

### Estado

- `queue` + `index`: la canción actual es `queue[index]`, derivado para evitar desincronización.
- `isPlaying`, `currentTime`, `duration`: los maneja el `<audio>`.
- `shuffle` (on/off) y `repeat` (`off` → `track` → `list`).
- `playSongs(songs, startIndex)`: punto de entrada para reproducir desde cards o playlists.

### Anterior / siguiente

- Cada salto apila el índice actual en un historial (`historyRef`, un `useRef` porque no se
  renderiza). Es una pila unificada: sirve para los dos modos.
- **Anterior**: si pasaron más de 3 s, reinicia la canción en vez de saltar. Si no, desenpila el
  historial y vuelve a la última canción realmente escuchada; si el historial está vacío, cae al
  índice anterior de la lista ordenada con wrap. Como el reinicio tiene prioridad, hay que apretar
  dos veces para retroceder de verdad. Al retroceder se descarta el historial hacia adelante
  (no hay botón de avance atrás).
- **Siguiente**: en aleatorio elige un índice al azar entre los que no son la canción actual ni
  las últimas 10 (`SHUFFLE_MEMORY`); si no queda ninguno, vuelve a excluir solo la actual. En
  secuencial avanza un índice, y con `repeat: 'list'` al final vuelve al inicio.
- `playSongs()` limpia el historial: una cola nueva es una sesión de escucha nueva.
- El historial vive solo en el cliente, así que no depende del backend: el endpoint solo cambia de
  dónde viene la cola (`songsService.listSongs()` hoy son mocks). No sobrevive a un refresh.
