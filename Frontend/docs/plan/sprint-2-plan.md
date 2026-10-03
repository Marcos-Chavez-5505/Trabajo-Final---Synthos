
# Sprint 2 — Plan de implementación (formato agente)

> Leer primero `/AGENTS.md` (convenciones) y `/docs/plan/sprint-1-plan.md` (ya entregado: Auth, Perfil, Reproductor, Buscar canciones/personas, Playlists+Favoritos). Este documento asume que Sprint 1 está completo y no repite esas tareas.

> Cada tarea es autocontenida. No asumas contexto de conversación fuera de lo declarado acá.

**Modo de trabajo:** sigue sin backend real. Mismo patrón de Sprint 1: `services/` con firma final, datos fake en `mocks/`. **Colores/tipografía: solo clases de `src/index.css`, nunca utilidades Tailwind de color/texto** (regla de AGENTS.md, sigue vigente).

**Corrección sobre Sprint 1:** la feature 7 (Seguir personas) estaba en el 25% pero no se incluyó en ese sprint. Se agrega acá como TS-10 porque la feature 8 la necesita.

---

## TS-10 — Seguir personas (feature 7, 25%)

**Contexto:** el usuario puede seguir/dejar de seguir a otros usuarios registrados. Acción unilateral (no requiere aprobación, como Instagram).
**Alcance:**

- Botón seguir/dejar de seguir en perfil público (`features/profile/ProfilePublic.jsx`, ya existe de TS-05 — extender, no recrear). **Corrección al plan:** el perfil público es `ProfilePublic.jsx`; `ProfileView.jsx` es el perfil propio y también muestra los contadores.
- Ver lista de seguidores y de seguidos (propios y de terceros).
  **Archivos:** extender `src/services/usersService.js` con `followUser(followerId, followingId)`, `unfollowUser(followerId, followingId)`, `isFollowing(a, b)`, `getFollowCounts(userId)`, `listFollowers(userId)`, `listFollowing(userId)`. Extender `mocks/users.js` con relaciones de seguimiento (array de pares `{followerId, followingId}`).
  **Criterios de aceptación:**

- [x] Seguir es inmediato, sin aprobación.
- [x] Botón cambia de estado visual según si ya sigo o no a esa persona.
- [x] Contadores de Seguidores/Seguidos del Sidebar (ya hardcodeados "100"/"32" desde el diseño) pasan a leer datos reales del usuario logueado. **Corrección al plan:** el Sidebar implementado no traía esa tarjeta con números fijos; se agregó `features/social/ProfileSummary.jsx` en `SidebarFooter` y los contadores también viven en los dos perfiles (`ProfileView` y `ProfilePublic`).
  **Dependencias:** TS-05 (perfil).

**Estado: entregado.**

- `mocks/users.js` → `mockFollows` (semilla: la cuenta demo `u1` queda con 7 seguidores y 3 seguidos; sin auto-follow).
- `services/usersService.js` → persistencia en `localStorage` bajo `synthos_mock_follows`, con la misma política de siembra que los usuarios. Las firmas pasan ids explícitos en vez de leer la sesión, porque `authService` ya importa este módulo y leerla acá crearía un ciclo de imports.
- `features/social/useFollow.js` → un solo hook por pantalla; `FollowButton` y `FollowStats` son presentacionales y reciben estado por props para que botón y contador no se contradigan. Follow/unfollow optimista con reversión en error.
- `features/social/FollowButton.jsx`, `FollowStats.jsx`, `ProfileSummary.jsx`, `FollowList.jsx`; fila reutilizable en `components/cards/UserRow.jsx` (también usada por `SearchPeople` de TS-08).
- Rutas: `/perfil/seguidores`, `/perfil/siguiendo`, `/profile/:id/seguidores`, `/profile/:id/siguiendo`. La relación se pasa por prop (no por param) para que una URL inválida no muestre una lista equivocada.
- Verificación: 19 casos de service (inmediatez, idempotencia, self-follow, usuario inexistente, contadores, listas sin `password`, persistencia), smoke SSR de rutas y piezas nuevas, `npm run build` y `npm run lint` sin warnings nuevos.
- Decisión: `unfollowUser(x, x)` es un no-op (el CHECK de la tabla impide *crear* la relación, no borrarla); el botón nunca se muestra sobre el propio perfil, así que la UI no lo llama.

---

## TS-11 — Calificar positivamente al anfitrión (feature 15, 50%)

**Contexto:** dentro de una sala, los participantes pueden calificar positivamente al anfitrión (ej. una estrella/like). Se acumula en su perfil.
**Alcance:**

- Solo participantes de esa sala pueden calificar.
- Una calificación por participante por sala (no repetible).
- El anfitrión no califica a nadie.
  **Archivos:** `src/services/roomsService.js` → `rateHost(roomId)`. Campo `hostRating` agregado al modelo de usuario en `mocks/users.js` (acumulado).
  **Criterios de aceptación:**

- [ ] Botón de calificar deshabilitado/oculto para el propio anfitrión.
- [ ] Un participante no puede calificar dos veces en la misma sala (bloqueo en el mock, no solo en UI).
- [ ] Calificación acumulada visible en perfil del anfitrión.
  **Dependencias:** TS-14 (Crear sala) — depende conceptualmente de que exista una sala con participantes, pero el contrato de servicio puede escribirse antes.

---

## TS-12 — Crear playlist colaborativa (feature 19, 50%)

**Contexto:** el usuario crea una playlist marcada como colaborativa. Él es el creador original.
**Alcance:**

- Crear playlist colaborativa (extensión de playlist normal, TS-09, con flag `isCollaborative` + `ownerId`).
- Participantes agregan canciones.
- **Solo el creador original elimina canciones** — participantes no pueden eliminar, solo agregar.
  **Archivos:** extender `src/services/playlistsService.js` con `createCollaborativePlaylist(data)`, `addSongToPlaylist(playlistId, songId)` (ya puede existir de TS-09, verificar permisos), `removeSongFromPlaylist(playlistId, songId)` (debe validar `ownerId === currentUser.id`).
  **Criterios de aceptación:**

- [ ] UI oculta/deshabilita el botón eliminar canción para quien no es el creador original.
- [ ] Participante puede agregar canciones sin restricción.
  **Dependencias:** TS-09 (Playlists personales, Sprint 1).

---

## TS-13 — Invitar usuarios a playlist colaborativa (feature 20, 50%)

**Contexto:** el creador de una playlist colaborativa genera un link de invitación. Quien entra con ese link se une como participante (solo agrega, no elimina).
**Alcance:**

- Generar link de invitación (solo visible/generable por el creador).
- Pantalla/flujo de "unirse a playlist" vía ese link.
  **Archivos:** `src/services/playlistsService.js` → `generateInviteLink(playlistId)`, `joinPlaylistByInvite(token)`. Ruta nueva en `AppRoutes.jsx` (ej. `/playlists/join/:token`).
  **Criterios de aceptación:**

- [ ] Solo el creador ve/genera el link.
- [ ] Usuario que entra por el link queda como participante (no creador), con permisos de TS-12.
- [ ] Link inválido/expirado (mock: token no encontrado) muestra error claro, no rompe la app.
  **Dependencias:** TS-12.

---

## TS-14 — Crear sala de escucha compartida (feature 10, 75%)

**Contexto:** el usuario crea una sala para reproducir música sincronizada a partir de una **playlist personal propia ya existente** (no necesariamente colaborativa — ver feature 11). **Si no tiene ninguna playlist, no puede crear sala.**
**Alcance:**

- Form: nombre, descripción (opcional), pública o privada (con contraseña si privada).
- Selección obligatoria de una playlist propia como fuente.
- Máximo 10 miembros por sala.
- Creador = único administrador.
  **Archivos:** `src/services/roomsService.js` → `createRoom(data)`, `joinRoom(roomId, password?)`. `src/features/rooms/CreateRoom.jsx`. `src/mocks/rooms.js`.
  **Criterios de aceptación:**

- [ ] Bloquea creación si el usuario no tiene ninguna playlist propia (mensaje claro, no error genérico).
- [ ] Sala privada exige contraseña para unirse; pública no.
- [ ] Al llegar a 10 miembros, nuevos intentos de unirse se rechazan con mensaje claro.
- [ ] Colores/tipografía con clases de `index.css`.
  **Dependencias:** TS-09 (Playlists personales, Sprint 1).

---

## TS-15 — Administrar sala de escucha (feature 11, 75%)

**Contexto:** el anfitrión controla la sala: expulsar miembros, controlar reproducción (pausar/reanudar/saltar/detener) para todos los presentes.
**Alcance:**

- Expulsar miembro (solo anfitrión).
- Control de reproducción centralizado: lo que hace el anfitrión se refleja en todos los miembros.
  **Archivos:** `src/services/roomsService.js` → `kickMember(roomId, userId)`, `controlPlayback(roomId, action)` (`play`/`pause`/`skip`/`stop`). `src/features/rooms/RoomView.jsx`.
  **Criterios de aceptación:**

- [ ] Solo el anfitrión ve controles de administración (kick, control reproducción).
- [ ] Miembro expulsado pierde acceso a la sala (mock: ya no aparece en su lista de salas activas).

**⚠️ Decisión técnica pendiente, necesito tu respuesta antes de que el agente implemente esto:** sin backend, "sincronizado para todos los miembros" no es real — es múltiples pestañas/usuarios viendo el mismo estado mock en vivo. Opciones:

- (a) Mockear sala de un solo usuario (el anfitrión simula ver miembros fake, sin sync real entre navegadores distintos) — más simple, no demuestra sync real.
- (b) Simular sync con `BroadcastChannel`/`localStorage` entre pestañas del mismo navegador — permite probar sync real sin backend, pero no entre dispositivos distintos.
- (c) Dejar la UI y el contrato de servicio listos, pero la sincronización real queda explícitamente fuera de este sprint, a implementar cuando haya backend con WebSockets.

**Dependencias:** TS-14.

---

## TS-16 — Buscar salas de escucha (feature 18, 75%)

**Contexto:** buscar salas por nombre de sala o nombre de usuario (anfitrión), con orden ascendente/descendente.
**Alcance:**

- Input de búsqueda + selector de orden (asc/desc).
- Resultados vacíos → mensaje informativo, no pantalla en blanco.
  **Archivos:** `src/features/search/SearchRooms.jsx`. Extender `roomsService.js` con `searchRooms(query, sortOrder)`.
  **Criterios de aceptación:**

- [ ] Búsqueda funciona por nombre de sala Y por nombre de usuario anfitrión.
- [ ] Selector asc/desc cambia el orden visiblemente.
- [ ] Estado vacío manejado.
  **Dependencias:** TS-14.

---

## TS-17 — Ordenar salas por calificación del anfitrión (feature 16, 25%)

**Contexto:** al buscar salas públicas, ordenar resultados por calificación del anfitrión (mejor calificado primero). Calificación visible en la tarjeta de sala.
**Alcance:** extiende TS-16 — agrega criterio de orden adicional ("por calificación de anfitrión") a los ya existentes (asc/desc por nombre).
**Archivos:** extender `searchRooms()` en `roomsService.js` con parámetro de criterio de orden. Mostrar `hostRating` (de TS-11) en la tarjeta de sala.
**Criterios de aceptación:**

- [ ] Nueva opción de orden "Mejor calificado" disponible junto a asc/desc.
- [ ] Calificación del anfitrión visible en cada card de resultado.
  **Dependencias:** TS-11 (Calificar anfitrión), TS-16 (Buscar salas).

---

## TS-18 — Votar para saltar canción (feature 12, 75%)

**Contexto:** en una sala, un miembro no-administrador puede iniciar votación para saltar la canción actual. Se aprueba por mayoría de miembros presentes. Cada miembro vota una vez por canción. El admin no vota; si el admin salta directamente, cancela cualquier votación en curso.
**Alcance:**

- Botón "votar para saltar" visible solo para no-administradores.
- Contador de votos visible, resolución automática al alcanzar mayoría.
- Reset del contador al cambiar de canción.
  **Archivos:** `src/services/roomsService.js` → `voteSkip(roomId)`, `getSkipVoteStatus(roomId)`.
  **Criterios de aceptación:**

- [ ] Administrador no ve/no puede usar el botón de votar.
- [ ] Un miembro no puede votar dos veces por la misma canción.
- [ ] Acción directa de "saltar" del admin cancela la votación en curso.
- [ ] Mismo `TODO` de sincronización que TS-15 aplica acá — depende de la misma decisión técnica pendiente.
  **Dependencias:** TS-15 (requiere la misma definición de sincronización).

---

## TS-19 — Recomendar canciones a personas (feature 8, 50%)

**Contexto:** usuarios que se siguen mutuamente pueden dejarse recomendaciones (canción + texto) en el perfil del otro, visibles cronológicamente. Quien envía solo ve sus propias recomendaciones enviadas; el dueño del perfil ve todas las que recibió.
**Alcance:**

- Formulario de recomendación (elegir canción + texto) disponible solo si hay seguimiento mutuo.
- Listado cronológico en el perfil público del destinatario.
  **Archivos:** `src/services/recommendationsService.js` (ya estaba en el árbol de AGENTS.md, implementar ahora) → `createRecommendation(toUserId, songId, text)`, `listRecommendationsReceived(userId)`, `listRecommendationsSent(userId)`.
  **Criterios de aceptación:**

- [ ] Formulario de recomendación oculto si no hay follow mutuo (usa TS-10).
- [ ] Orden cronológico correcto (más reciente primero o último, definir y ser consistente).
- [ ] Visibilidad respetada: emisor ve solo lo suyo, dueño del perfil ve todo.
  **Dependencias:** TS-10 (Seguir personas).

---

## TS-20 — Recomendaciones por estado de ánimo con IA (feature 14, 50%)

**Contexto:** el usuario pide recomendaciones de música según su estado de ánimo, detectado por escaneo facial con IA (alegría, tristeza, etc.).

**⚠️ Decisión de producto pendiente, necesito tu respuesta antes de planificar el detalle técnico:** esta feature requiere acceso a cámara + un modelo de reconocimiento de emociones. Con "solo mocks" como estamos trabajando, hay tres caminos de alcance muy distintos:

- (a) **Mock total:** el usuario elige manualmente su estado de ánimo de una lista (sin cámara real), y el sistema devuelve canciones mock asociadas a ese humor. Rápido, cero integración de IA real.
- (b) **Cámara real + mock de clasificación:** se pide acceso a cámara del dispositivo, se captura una foto, pero la "detección" de humor es simulada (aleatoria o fija) — sirve para probar el flujo de permisos/UI sin integrar un modelo real.
- (c) **IA real:** integrar un modelo/servicio real de reconocimiento de emociones (requiere elegir proveedor, costos, y probablemente excede el alcance de "sin backend").

Mientras no definas esto, no puedo escribir criterios de aceptación reales para esta tarea.

**Dependencias:** ninguna técnica dura, pero bloqueada por la decisión de alcance de arriba.

---

## Orden de ejecución sugerido para el agente

TS-10 → TS-11 → TS-12 → TS-13 → TS-14 → TS-15 → TS-16 → TS-17 → TS-18 → TS-19 → (TS-20 en espera de definición)
