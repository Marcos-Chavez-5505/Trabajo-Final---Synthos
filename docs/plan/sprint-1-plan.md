
# Sprint 1 — Plan de implementación (formato agente)

> Leer primero `/AGENTS.md` (raíz del repo) — contiene stack, estructura de carpetas y convenciones de nombres obligatorias. Este documento asume esas convenciones y no las repite salvo excepción.

> Cada tarea es autocontenida: incluye contexto, alcance, criterios de aceptación y archivos. No asumas conocimiento de tareas anteriores fuera de lo declarado en "Dependencias".

**Modo de trabajo actual:** sin backend real. Toda tarea que use datos usa `src/mocks/` + `services/` con firma idéntica a la futura API real (promesas, misma forma de respuesta). No hardcodear datos dentro de componentes.

**Convención de estilos (obligatoria):** `src/index.css` define el design system en clases CSS propias (colores, tipografía, elevación). Todo componente/feature de este sprint debe usarlas en vez de colores o tamaños de texto arbitrarios de Tailwind.

- Colores → clases de fondo: `Red`, `Salmon`, `Lighter`, `Pink`, `Light`, `Shadow`, `Plaster`, `Volume`, `Wall`, `WallGradient`, `Surface`, `SurfaceLight`, `LighterMuted`, `LightMuted`, `Fucsia`, `BackgroundChat`.
- Tipografía → clases de texto: `Header1`, `Header2`, `Header3`, `Header4`, `TextLarge`, `TextRegluar` (typo intencional, no corregir), `TextMedium`, `TextTiny`, `Button`.
- Sombra → `Elevation1`.
- Se pueden combinar con utilidades Tailwind de layout (`flex`, `p-4`, `rounded`, `w-full`, etc.) — lo que reemplazan es específicamente color y tipografía, no estructura.
- `BackgroundChat` tiene `background:` vacío en `index.css` (pendiente de valor) — no usar hasta que se complete, o usar `Surface`/`Volume` como fallback temporal.
- Prohibido: `bg-neutral-800`, `text-white`, `text-sm`, etc. de Tailwind para color/tipografía en componentes nuevos de este sprint. Excepción: estados que no tienen token definido (ej. focus ring) — usar Tailwind ahí y dejar comentario `TODO: falta token`.

---

## TS-01 — Setup base del proyecto

**Estado:** hecho (ver commit/carpeta `project/` entregada).
**Contexto:** app de música social, React + Vite + Tailwind CSS, target web + mobile (Capacitor futuro).
**Alcance:** proyecto compilable, sin features de negocio.
**Archivos:** `package.json`, `vite.config.js`, `postcss.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`, `src/routes/AppRoutes.jsx`.
**Criterios de aceptación:**

- [x] `npm install && npm run dev` levanta app sin errores.
- [x] Ruta `/` renderiza `AppLayout` con contenido placeholder.
- [x] Tailwind activo (clase de prueba visible).

**Nota (post-entrega): tabla de rutas reales.** `App.jsx` monta `routes/AppRoutes.jsx`; `/` quedó como landing pública y la app autenticada arranca en `/home` (el criterio de arriba quedó así). Guards: `RequireAuth` en las rutas de app (`LoadingScreen` mientras resuelve la sesión, redirect a `/login`), `PublicOnly` en `/login` y `/register` (si hay sesión, redirect a `/home`).

| Ruta | Render | Auth |
| --- | --- | --- |
| `/` | `pages/Landing/Landing.jsx` | pública |
| `/login`, `/register` | `features/auth/Login.jsx`, `Register.jsx` | `PublicOnly` |
| `/home` | `features/home/Home.jsx` (Desktop/Mobile por `useBreakpoint`) | `RequireAuth` + `AppLayout` |
| `/perfil` | `features/profile/ProfileView.jsx` | `RequireAuth` + `AppLayout` |
| `/populares`, `/playlists`, `/albums`, `/artistas`, `/salas`, `/buscar` | shell "en construcción" | `RequireAuth` + `AppLayout` |
| `*` | redirect a `/` | — |

Los shells son `ScreenPlaceholder` local en `AppRoutes.jsx`; cada pantalla se completa en su sprint. Los enlaces del `Sidebar` y del `BottomNav` apuntan a esta tabla.

**Nota (post-entrega): auth unificada.** `authService` ya no tiene su propio store de usuarios: delega en `usersService` (`createUser`, `findUserByEmail`), que es el dueño de `mocks/users.js`. Así el usuario tiene una sola forma canónica (`id`, `email`, `username`, `avatarUrl`, `bio`) y `updateProfile`/`ProfileView` funcionan sobre el mismo registro. Se eliminaron `pages/Login` y `pages/Register` legacy (llamaban al service directo, violando la regla 5, y usaban colores literales); ahora el login/registro vive en `features/auth/` y va por `useAuth()`.

---

## TS-02 — Layout base (shells, sin lógica)

**Estado:** hecho.
**Contexto:** la app tiene un layout desktop (sidebar fijo) y uno mobile (bottom nav + mini player). Ver imágenes de referencia adjuntas al proyecto original (`Home Desktop`, `Home Mobile`) para look & feel (tema oscuro, cards lilas, acento rosa/magenta).
**Alcance:** componentes de layout sin lógica de negocio, reciben props o children.
**Archivos:**

- `src/components/layout/AppLayout.jsx` — decide Sidebar vs BottomNav según `useBreakpoint`.
- `src/components/layout/Sidebar.jsx` — nav desktop: Home, Populares, Mi Colección (Playlists/Albums/Artistas), Mis Salas, Mis Playlists.
- `src/components/layout/BottomNav.jsx` — nav mobile: Home, Salas, Buscar, Playlists.
- `src/components/layout/TopBar.jsx` — flechas navegación + buscador (solo UI).
- `src/components/layout/MiniPlayerBar.jsx` — barra reproductor mobile (solo UI, sin estado real).
- `src/hooks/useBreakpoint.js` — hook responsive (`md` breakpoint = 768px).
  **Criterios de aceptación:**

- [x] Debajo de 768px se ve BottomNav, arriba Sidebar.
- [x] Sidebar/BottomNav marcan visualmente ruta activa.
- [x] Ningún componente de layout hace fetch ni contiene datos hardcodeados de negocio (usar props/placeholders).
- [x] Colores y tipografía usan las clases de `index.css` (ver "Convención de estilos" arriba), no utilidades Tailwind de color/texto.

**Nota (post-entrega): Sidebar migrado a shadcn/ui.**

- `src/components/layout/Sidebar.jsx` ahora usa los componentes shadcn (`SidebarProvider`, `Sidebar`, `SidebarMenu`, etc.) de `src/components/ui/sidebar.tsx`, que corren sobre `@base-ui/react` (estilo `base-nova`). Navegación y rutas activas se resuelven con `react-router` (NavLink vía prop `render` de base-ui + `isActive`), manteniendo la data de menú original (Home, Populares, Mi Colección, Mis Salas, Mis Playlists — sin "Grupos"). El colapso a mini-sidebar usa `Tooltip` (formato nativo base-ui).
- El `SidebarProvider` se monta SOLO en la rama desktop de `AppLayout.jsx` (el comportamiento mobile/drawer de shadcn no se usa); mobile sigue con `BottomNav` + `MiniPlayerBar`.
- Los archivos shadcn generados importan CSS desde `src/index.css` (que ahora es el único entrypoint, además de contener el theme). Se eliminó `src/styles/index.css`.
- Variables shadcn mapeadas a tokens del dominio (`src/index.css:root`):
  - `--sidebar` ← `Wall` (`#605468`); `--sidebar-foreground` ← `--text` (`#f2eefb`).
  - `--sidebar-primary` ← `Fucsia` (`#ef2f62`); `--sidebar-primary-foreground` ← texto sobre Fucsia (`#1a0711`); ítem activo → `bg-sidebar-primary`.
  - `--sidebar-accent` ← `Volume` (`#373038`); `--sidebar-accent-foreground` ← `--text`.
  - `--sidebar-border` ← `Volume`; `--sidebar-ring` ← `accent` (`#e91e63`).
  - Tema global shadcn: `--background` ← `--bg` (`#0a0713`), `--foreground` ← `--text`, `--primary` ← `Fucsia`, `--muted`/`--secondary`/`--input` ← `Volume`, `--accent`/`--ring` ← `#e91e63`, `--card`/`--popover` ← `SurfaceLight`, `--destructive` ← `Red`.
- Tipografía visible del Sidebar usa tokens (`TextMedium` en grupo labels, `TextRegluar` en ítems) en lugar de `text-xs`/`text-sm`; el estado alojado en `src/components/ui/*.tsx` no usa colores literales (el único `bg-black/10` del scrim de Sheet se reemplazó por `bg-foreground/15`).

---

## TS-03 — Auth: contrato de servicio mock + contexto

**Estado:** hecho (lógica de validación completada).
**Contexto:** feature 5 (Registrar Usuario) y 6 (Iniciar/Cerrar Sesión) de la lista de funcionalidades. Sin backend: toda auth es mock en memoria.
**Alcance actual (ya resuelto):** contrato del servicio y contexto, sin reglas de validación de negocio.
**Alcance pendiente para el agente:**

- Validación de email (formato + unicidad contra `mocks/users.js`).
- Validación de contraseña seed (mínimo 8 caracteres, 1 número, 1 mayúscula — definir regla exacta si difiere).
- Persistencia de sesión mock (localStorage) para no perder sesión al refrescar.
- Manejo de errores (email duplicado, credenciales inválidas) propagado a la UI.
  **Archivos:**
- `src/services/authService.js` — funciones: `register(data)`, `login(email, password)`, `logout()`, `getCurrentUser()`. Ahora mismo devuelven promesas con datos fijos/TODO.
- `src/context/AuthContext.jsx` — expone `user`, `login`, `logout`, `register`, `loading`.
- `src/mocks/users.js` — array semilla de usuarios fake.
  **Criterios de aceptación:**

- [x] `authService` nunca es llamado directamente desde componentes — solo vía `AuthContext`.
- [x] `register` rechaza email duplicado (comparando contra `mocks/users.js`).
- [x] `login` rechaza credenciales inválidas con mensaje de error claro.
- [x] Sesión persiste tras refrescar navegador (mock vía localStorage), hasta `logout()`.
  **Dependencias:** TS-01.

---

## TS-04 — Pantallas Login / Registro (UI, conectar a AuthContext)

**Estado:** hecho (conectado a `useAuth()`, loading/error, redirect y rutas protegidas).
**Contexto:** feature 5 y 6. Sin mockup final — usar estética de Home (fondo oscuro `#000` / `neutral-900`, acentos rosa `#e91e63`-like, tarjetas `neutral-300`/lila para placeholders de imagen).
**Alcance:**

- Formulario registro: email, username, password, confirmación password.
- Formulario login: email, password.
- Feedback de error inline (usar mensajes que devuelve `AuthContext`).
- Redirect a Home tras login/registro exitoso.
  **Archivos:** `src/features/auth/Login.jsx`, `src/features/auth/Register.jsx`, ruta en `AppRoutes.jsx`.
  **Criterios de aceptación:**

- [x] Formularios controlados (React state), sin librerías externas de forms salvo que ya estén en `package.json`.
- [x] Botón submit deshabilitado mientras `loading` es true.
- [x] Errores de `AuthContext` se muestran al usuario sin `alert()`.
- [x] Responsive: usable en mobile y desktop.
- [x] Colores y tipografía usan las clases de `index.css`, no utilidades Tailwind de color/texto.
- [x] Rutas protegidas: sin sesión se redirige a `/login`; con sesión, `/login` y `/register` redirigen a Home. (`RequireAuth`/`PublicOnly` envuelven las rutas; `LoadingScreen` mientras resuelve la sesión.)
  **Dependencias:** TS-01, TS-02, TS-03.

---

## TS-05 — Perfil: ver y editar (feature 9)

**Estado:** hecho.
**Alcance:** ver perfil propio, editar foto (upload o default avatar), bio, username.
**Archivos:** `src/features/profile/ProfileView.jsx`, `src/features/profile/ProfileEdit.jsx`, `src/services/usersService.js` (mock).
**Criterios de aceptación:**

- [x] Avatar default si no hay foto subida.
- [x] Cambios se reflejan en `AuthContext.user` tras guardar (mock, sin persistencia real fuera de sesión).
- [x] Validación: username no vacío.
- [x] Colores y tipografía usan las clases de `index.css`, no utilidades Tailwind de color/texto.
  **Dependencias:** TS-03.

---

## TS-06 — Reproductor (features 1, 2, 3, 4)

**Estado:** hecho.
**Alcance:** play/pause, siguiente/anterior, shuffle on/off, repeat (ninguno/canción/lista), barra de progreso interactiva (click y drag), muestra título/artista/duración.
**Archivos:** `src/context/PlayerContext.jsx`, `src/components/player/PlayerBar.jsx` (desktop), `src/components/layout/MiniPlayerBar.jsx` (conectar, ya existe shell), `src/components/player/PlayerControls.jsx`, `src/components/player/ProgressBar.jsx`, `src/services/songsService.js` (mock), `src/mocks/songs.js`.
**Criterios de aceptación:**

- [x] Un solo estado de reproducción global (`PlayerContext`), consumido igual por `PlayerBar` y `MiniPlayerBar`.
- [x] Shuffle y repeat mantienen su estado durante la sesión (no persiste tras refresh, no requerido).
- [x] Barra de progreso se actualiza en tiempo real y permite seek (click/drag).
- [x] Reproducción real de audio local (usar `<audio>` HTML5 con archivos mock o URLs de prueba).
  **Dependencias:** TS-01, TS-02.

**Nota (post-entrega): implementación.**

- `PlayerProvider` (envuelto en `main.jsx` junto a `AuthProvider`, o sea global) maneja un único `<audio>` HTML5 oculto. Estado: `queue` + `index` (la canción actual es `queue[index]`, Derivada, para evitar desincronización), `isPlaying`, `currentTime`, `duration`, `shuffle`, `repeat`.
- Eventos del elemento (`timeupdate`, `loadedmetadata`, `ended`) alimentan el estado; `isPlaying` es la única fuente de verdad de play/pause (el `play()` se captura con `.catch` por si el navegador bloquea autoplay). La duración real del archivo pisa la del mock al cargar metadata.
- `next()`: si `shuffle` elige un índice al azar entre los que no son la actual ni las últimas 10 (`SHUFFLE_MEMORY`), con fallback a "cualquiera menos la actual"; en secuencial avanza un índice y, si se llega al final, `repeat: 'list'` vuelve al inicio y `repeat: 'off'` detiene. `previous()`: si pasaron >3s reinicia la canción, si no desenpila `historyRef` (índices ya reproducidos, del más nuevo al más viejo) y vuelve a la última canción escuchada; con el historial vacío cae al índice anterior de la lista ordenada con wrap. La pila es unificada para ambos modos y `playSongs()` la limpia. `repeat` cicla `off → track → list → off`.
- `ProgressBar`: presentacional, con `role="slider"`, seek por click y por arrastre (`setPointerCapture`), y teclado (←/→ 5s, `Home` al inicio). Formato de tiempo en `src/lib/formatTime.js`.
- `PlayerControls` consume `usePlayer()` directo (sin prop drilling) y lo usan igual `PlayerBar` (desktop) y `MiniPlayerBar` (mobile). `PlayerBar` se monta en la rama desktop de `AppLayout`.
- `mocks/songs.js` = 8 tracks con `audioUrl` a MP3 públicos de prueba (SoundHelix) para reproducir audio real; `coverUrl: null` hasta que exista backend de imágenes. `songsService` expone `listSongs()` / `getSongById(id)` async.
- Cola inicial: hoy es el catálogo mock completo, para que el reproductor sea usable sin pantallas; `playSongs(songs, startIndex)` es el punto de entrada que TS-07/TS-09 van a usar al reproducir desde cards/playlists.
- Íconos: salen de `src/assets/*.svg` (set de diseño, no de librerías). Se importan como URL (`import playIcon from '../../assets/play.svg'`) y se renderizan con `<img src={...} alt="" aria-hidden="true" className="h-5 w-5" />`. En el reproductor: `play`, `pause`, `next_track`, `previous_track`, `shuffle`, `repeat`, `repeat_only_one` y `music_note` (placeholder de carátula mientras no haya `coverUrl`). **No** usar `?react`: no lo transforma `@vitejs/plugin-react` acá, el import queda como string `data:image/svg+xml` y `<Icon />` revienta con `InvalidCharacterError: The tag name provided ('data:...')`. Los SVG traen `#F4F0F9` hardcodeado (= token `Lighter`), por eso los iconos de estado activo van sobre fondo `Fucsia`/`Volume` y no se recolorean.

**Nota (rediseño de layout).**

- `PlayerBar` desktop ahora ocupa **todo el ancho de la ventana**: se monta como hermano de la fila `Sidebar + contenido` dentro de `SidebarProvider` (que pasó a `flex-col`). Como el sidebar es `fixed h-svh`, su `SidebarContent` lleva `pb-16` para que el reproductor no tape las últimas secciones.
- Fila superior: carátula (`Light`) + título/artista + línea `TextTiny uppercase` "Reproduciéndose desde: {song.source}"; controles al centro; botón **expandir** a la derecha (`expand.svg`, solo visual, con `TODO` para pantalla completa y alternar `collapse.svg`).
- Fila inferior: `ProgressBar` a ancho completo **con etiquetas de tiempo** (se mantienen en desktop y mobile).
- Play/pause va en círculo `Lighter` con el icono `invert` (los SVG son claros); shuffle/repeat activos sobre `Fucsia`. `ControlButton` se exporta desde `PlayerControls.jsx` con tonos `ghost`/`solid`/`soft` y lo reutiliza el mini reproductor.
- `MiniPlayerBar` (mobile) quedó conectado al `PlayerContext`: `SurfaceLight Elevation1 rounded-t-2xl fixed bottom-14`, sin carátula, título/artista, **Play + Siguiente a la derecha** y progreso con etiquetas.
- `mocks/songs.js` suma `source` (origen "Reproduciéndose desde"), asignado al azar por canción desde una lista `SOURCES`; el `PlayerContext` no cambió, solo se lee `song.source`.

---

## TS-07 — Buscar canciones (feature 13)

**Estado:** hecho.
**Alcance:** búsqueda por nombre canción, artista o género. Resultados paginados.
**Archivos:** `src/features/search/SearchSongs.jsx`, extender `songsService.js` con `searchSongs(query, page)`.
**Criterios de aceptación:**

- [x] Debounce en input de búsqueda (evitar búsqueda en cada tecla sin pausa).
- [x] Paginación funcional sobre datos mock.
- [x] Estado vacío ("sin resultados") manejado.
  **Dependencias:** TS-06 (reutiliza `MediaCard` y catálogo mock de canciones).

**Nota (post-entrega): implementación.**

- `SearchSongs.jsx` lee `?q=` y `?page=` de la URL, así la búsqueda se comparte y el botón "atrás" del
  browser funciona; `TopBar` navega a `/buscar?q=` sobre el mismo input. Debounce de 300 ms con
  `hooks/useDebounce.js`.
- Cada respuesta se guarda con la `requestKey` (`query::page`) que la pidió: el loading se **deriva**
  comparando keys en vez de setear un booleano, así no hay un render en cascada ni se muestra un
  resultado viejo con la query nueva. El `AbortController` del efecto aborta la petición al limpiar.
- Paginación con elipsis: `buildPageRange()` devuelve las páginas a dibujar y `null` en los huecos, que
  es la señal para `<PaginationEllipsis />`. Movida a `src/lib/pageRange.js` al hacer TS-08, que la
  reutiliza.
- Estados cubiertos: cargando, error (muestra el mensaje del backend, no uno genérico) y vacío con la
  query en el texto.

**Nota (migración a backend).** Los criterios se cerraron contra el mock y después la pantalla pasó a la
API real (`GET /api/songs/search?query=&page=&pageSize=`), así que el segundo criterio se cumple hoy
sobre datos del servidor y no sobre el mock. Detalle en `ESPECIFICACIONES-BACKEND.md` (`docs/`):

- La paginación pasó de cursor a offset porque un cursor no puede expresar "la página 7".
- Se sacó "álbumo" del copy: el backend no tiene columna `album` ni filtra por ella. Cuando se agregue,
  la palabra vuelve al texto.
- `mocks/songs.js` quedó sin imports. No se borró hasta poder validar contra el endpoint real.
- Sigue pendiente probarlo contra Postgres: no hay `Backend/.env` ni base levantada (ver `PENDIENTES.md`).

---

## TS-08 — Buscar personas (feature 17)

**Estado:** hecho.
**Alcance:** búsqueda por username, resultados paginados, acceso a perfil público.
**Archivos:** `src/features/search/SearchPeople.jsx`, extender `usersService.js` con `searchUsers(query, page)`.
**Criterios de aceptación:**

- [x] Paginación funcional.
- [x] Click en resultado navega a perfil público (`/profile/:id`, aunque esa vista sea básica).
  **Dependencias:** TS-05.

**Nota (post-entrega): implementación.**

- `/buscar` ahora es una pantalla con pestañas: `features/search/Search.jsx` lee `?tipo=` y monta
  `SearchSongs` o `SearchPeople`. El tipo vive en la URL, no en `useState`, así el enlace es
  compartible y el "atrás" del browser funciona entre pestañas. Sin `?tipo=` abre en canciones, que es
  lo que espera el input global de `TopBar`.
- `SearchTabs.jsx` es el encabezado compartido (h1, bajada y pestañas) para que las dos pantallas no
  repitan el esqueleto. Cambiar de pestaña vuelve a la página 1: la página 4 de canciones no significa
  nada en personas.
- `usersService.searchUsers(query, page, pageSize)` devuelve el **mismo contrato que
  `songsService.searchSongs()`** (`{ items, total, page, pageSize, totalPages }`), así `Pagination` no
  cambia entre una pantalla y la otra. Es async aunque hoy resuelva sobre `mocks/users.js`, para que al
  pasar a `api.js` el componente no se entere.
- Búsqueda por username con `normalize()` (NFD, sin diacríticos, `ñ`→`n`, minúsculas y `trim`): "juan"
  encuentra a "Juán". Devuelve `total` de **todas** las coincidencias, no de la página, que es lo que
  permite dibujar los números.
- `mocks/users.js` pasó de 1 a 10 usuarios: con `SEARCH_PAGE_SIZE = 4` quedan 3 páginas, así la
  paginación se ve sin backend. El primero sigue siendo la cuenta de demo de login/register.
  **Ojo:** `getStoredUsers()` siembra desde el mock solo si no hay nada en `localStorage`, así que quien
  ya tenga `synthos_mock_users` guardado ve 1 usuario y una sola página. Hay que borrar esa clave (o el
  storage del sitio) para ver los 10.
- `buildPageRange()` se movió de `SearchSongs.jsx` a `src/lib/pageRange.js` porque las dos pantallas lo
  usan; es lógica pura, sin dependencias.
- Perfil público: `features/profile/ProfilePublic.jsx` en `/profile/:id`. Es **distinto** de
  `ProfileView.jsx` (el propio, editable, en `/perfil`): este es de lectura, muestra avatar/username/bio y
  manda a `/perfil` si el usuario es uno mismo. Va **fuera de `Protected`** a propósito, porque una vista
  de lectura no debería depender de que haya sesión.
- Cada ítem es un `<Link>` completo, no solo el username: con mouse o teclado se llega al perfil igual.
- Verificación: script temporal con `localStorage` simulado (14 casos: contrato, primera/última página,
  página fuera de rango, `page=0`, acentos, `ñ`, espacios, prefijo/subcadena, cero resultados,
  recorrido completo sin repetidos, y que la contraseña nunca se exponga) y otro para `buildPageRange`
  (8 casos). Todos pasaron y se borraron después; el repo no tiene runner de tests.
- No verifiqué el render en navegador: no hay Playwright ni servidor de pruebas. Levantá `npm run dev` y
  entrá a `/buscar?tipo=personas`.

---

## TS-09 — Playlists personales + Favoritos (bloqueante de Salas, sprint futuro)

**Estado:** hecho.
**Alcance:** crear/editar/eliminar playlist personal, agregar/quitar canciones, marcar favorito (auto-genera playlist "Mis Favoritos").
**Archivos:** `src/features/playlists/*`, `src/services/playlistsService.js` (mock).

**Criterios de aceptación:**

- [x] Playlists privadas, solo visibles para su dueño.
- [x] "Mis Favoritos" se autogenera al marcar la primera canción favorita.
  **Dependencias:** TS-06.

### Decisiones

- **`ownerId` obligatorio en cada operación del service.** La privacidad no se resuelve en la UI: `listPlaylists`,
  `getPlaylistById`, `updatePlaylist`, `removePlaylist`, `addSongToPlaylist`, `removeSongFromPlaylist` y los dos de
  favoritos filtran siempre por dueño. `getPlaylistById` devuelve `null` si el id es de otro, y la UI muestra
  "no encontrada" sin distinguir los casos, para no confirmar que ese id existe.
- **Los favoritos son una playlist con `isFavorites`, no un estado aparte.** Así el reproductor, la biblioteca y el
  detalle comparten una sola fuente de verdad y no hay que sincronizar dos estados. El flag va en vez de comparar el
  nombre para que nadie pueda crear una playlist llamada "Mis Favoritos" y se confunda con la real.
- **"Mis Favoritos" no se puede renombrar ni borrar** (`updatePlaylist` y `removePlaylist` la rechazan, y la UI
  esconde los botones). Si se borrara al desmarcar la última canción, el usuario vería desaparecer y reaparecer su
  colección sin explicación.
- **La playlist guarda `songIds`, no canciones enteras.** Las canciones son del backend; duplicar el objeto las
  dejaría viejas en el primer cambio de título o carátula. El detalle las resuelve con `Promise.all` de
  `getSongById`, uno por id, porque el backend no expone `GET /api/songs?ids=`. Cuando lo tenga, ese bloque es el
  único que hay que cambiar. Un 404 se lista como "no disponible" en vez de tirar la vista.
- **`useFavorites` es un hook, no un Context.** No hay Provider de playlists en el árbol; lo consumen pantallas bajo
  `AppLayout` y el `PlayerBar`, que sí es global, toma el estado de ahí.
- **Favorito y "agregar a playlist" viven en el reproductor, no en cada card.** Es el único lugar donde ya se sabe
  qué canción está cargada; ponerlos en `MediaCard`/`MiniMediaCard` obligaría a duplicar el botón en tres
  componentes. En mobile el mini reproductor lleva solo el corazón, que no necesita panel.
- **`AddToPlaylistPanel` es un panel inline, no el `Sheet` de shadcn.** Ese componente no se usó nunca en el repo y
  depende de las animaciones de base-ui, imposibles de verificar sin navegador. Cuando haya E2E se puede migrar.
- **`MisPlaylists` (la sección del Sidebar) vive en `features/playlists/`**, no dentro de `Sidebar.jsx`, porque
  consulta un service y los componentes de layout no piden datos. Su dependencia es una firma de ids+nombre: quitar
  una y agregar otra deja el mismo `length`, así que comparar la cantidad no alcanza.
- **La siembra es por usuario.** `seededOwners` evita que, si el usuario borra todas sus playlists, la biblioteca
  vacía se vuelva a llenar sola.
- Rutas: `/playlists` y `/playlists/:id` (reemplazan el shell "en construcción"), ambas bajo `Protected` porque son
  datos privados.

### Verificación

- Script temporal sobre `playlistsService` con `localStorage` simulado, 14 casos: siembra por dueño, no re-siembra
  tras borrar todo, privacidad de lectura y de escritura (agregar/quitar/eliminar sobre una playlist ajena no la
  modifica), nombre vacío rechazado en crear y editar, favorites no se autogenera al listar ni al consultar
  `isFavorite`, sí se autogenera al marcar, sigue existiendo al desmarcar la última, `43886` y `"43886"` son la
  misma canción, favoritos no se mezclan entre dueños, agregar es idempotente, quitar conserva el orden, y las
  operaciones sin dueño fallan. Todos pasaron y el script se borró.
- Smoke render con `renderToString` (vite `--ssr`) de las rutas nuevas y de cada pieza presentacional: no tira
  errores y el markup sale como corresponde (corazón lleno solo cuando `isFavorite`, `bytes=49` —o sea `null`— cuando
  no hay `songId`). **No** cubre el estado con datos cargados, porque `renderToString` no corre efectos. Se borró.
- `npm run build` y `npm run lint` pasan con los mismos 3 warnings preexistentes.
- No verifiqué la interacción en navegador. Levantá `npm run dev`, entrá a `/playlists` y probá: crear, renombrar,
  eliminar, agregar desde el reproductor, y marcar el corazón con una sesión nueva para ver aparecer "Mis Favoritos".
  **Ojo:** la library se guarda en `synthos_mock_playlists`; si sembraste antes de este sprint, borrá esa clave.

---

## Orden de ejecución sugerido para el agente

TS-04 → TS-05 → TS-06 → TS-07 → TS-08 → TS-09

(TS-01, TS-02, TS-03 ya entregados como base — no repetir, solo completar lógica pendiente marcada en TS-03 si aplica.)

---

## Diagnóstico visual y fixes aplicados (post-TS-05)

**Diagnóstico previo (sin tocar estilos):**

- Violaciones de la regla de estilos (utilidades Tailwind de color/texto fuera de `index.css`):
  - `src/routes/AppRoutes.jsx` — `text-neutral-400` en el placeholder de Home (única violación en pantallas en uso).
  - `placeholder-neutral-500` en TopBar, Login, Register y ProfileEdit — excepción deliberada con `TODO` (permitida por convención del plan).
  - El resto de las pantallas reales (layout, auth, perfil) ya usan tokens. Los scaffolds (`ui/`, `cards/`, `chat/`, `player/`, `home/`) están vacíos (`return null`). La Landing usa su propio CSS BEM y no está enrutada (fuera de la app).
- Problemas de layout mobile/desktop:
  - `MiniPlayerBar` fija en `bottom-14` (56px) vs `BottomNav` de altura real ~30px → hueco visible entre ambas en mobile.
  - `main` con `pb-24` (96px) < 112px reales que ocupan MiniPlayer + BottomNav → final del contenido quedaba tapado.
  - Perfil: username/email largos podían desbordar el card horizontalmente.

**Correcciones aplicadas (puntuales, sin reescribir componentes):**

- `BottomNav`: altura fija `h-14` + `justify-center` en items → se alinea con `MiniPlayerBar` (`bottom-14`), sin hueco.
- `AppLayout`: `pb-24` → `pb-28` en `main` (mobile) para que el contenido no quede bajo las barras.
- `ProfileView`: `min-w-0` + `truncate` en el bloque nombre/email.
- `AppRoutes`: placeholder Home con `TextRegluar opacity-70` en vez de `text-neutral-400`.
- Protección de rutas: `RequireAuth` (rutas privadas) y `PublicOnly` (`/login`, `/register`) con `LoadingScreen`; al loguearse se vuelve a la ruta de origen (`state.from`).
