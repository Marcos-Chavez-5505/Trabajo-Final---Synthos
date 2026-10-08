# Sprint 2 — Plan unificado (formato agente)

> Leer primero `/AGENTS.md` (convenciones) y `/docs/plan/sprint-1-plan.md` (ya entregado: Auth, Perfil, Reproductor, Buscar canciones/personas, Playlists+Favoritos). Este documento asume Sprint 1 completo y no repite esas tareas.

> Cada tarea es autocontenida. No asumas contexto de conversación fuera de lo declarado acá.

---

## Modo de trabajo

- **Frontend:** `services/` con firma final, datos fake en `mocks/`. Cuando exista el endpoint real (ver campo **Backend** de cada tarea), el service cambia de mock a HTTP **sin cambiar su firma**.
- **Backend:** cada tarea declara endpoint, códigos de respuesta y criterios. Si dice "Revisar: ya existe parcialmente", verificar el código antes de implementar.
- **Colores/tipografía:** solo clases de `src/index.css`, nunca utilidades Tailwind de color/texto (regla de AGENTS.md, sigue vigente).
- **Orden dentro de una feature:** backend primero, frontend después.

**Corrección sobre Sprint 1:** la feature 7 (Seguir personas) estaba en el 25% pero no se incluyó en ese sprint. Se agrega acá como TS-10 porque la feature 8 la necesita.

---

## Decisiones pendientes (resolver antes de implementar lo que bloquean)

| #   | Decisión                                                                                                                                                                                                                                                     | Opciones                                                                                                                                                                 | Bloquea              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| D1  | **Destinatario de una recomendación.** El modelo de contenido guarda autor, texto, canción y fecha, pero no destinatario.                                                                                                                             | Guardarlo en`content_playement` o agregar campo nuevo.                                                                                                                 | TS-19 (B1, B2)       |
| D2  | **Visitante externo** (ni emisor ni receptor): ¿ve las recomendaciones en el perfil público?                                                                                                                                                          | Sí / No. Regla actual: dueño ve todas las recibidas, emisor solo las suyas.                                                                                            | TS-19 (B1, F2)       |
| D3  | **Almacenamiento de fotos de perfil.** No hay infraestructura de subida. El despliegue es en Vercel, **el disco local no persiste**: favorece servicio externo.                                                                                   | Disco del servidor / servicio en nube (Cloudinary, S3, etc.) / imagen embebida.                                                                                          | TS-21 (B3)           |
| D4  | **Detección de estado de ánimo** (escaneo facial con IA). No hay código ni dependencias de IA.                                                                                                                                                       | Mock total (elige humor de lista) / cámara real + clasificación simulada / detección en navegador (modelo liviano) / API de visión externa / en backend.             | TS-20 (F9)           |
| D5  | **Crear calificaciones de anfitrión.** Existe la tabla y la vista de promedio, pero **no hay endpoint para crear**; los datos vienen del seed.                                                                                                   | Agregar tarea backend (propuesta B10 en TS-11) / dejar solo seed.                                                                                                        | TS-11 en producción |
| D6  | **"Calificaciones positivas".** El alcance dice positivas, la vista actual promedia todas.                                                                                                                                                              | Promedio de todas / solo positivas (ej. 4 a 5).                                                                                                                          | TS-11, TS-17         |
| D7  | **Respuesta real de `GET /api/rooms`.** El modelo de sala no tiene campo de anfitrión (se infiere por rol en la sala). Verificar que incluya nombre y calificación del anfitrión.                                                                  | Verificar / ajustar endpoint.                                                                                                                                            | TS-16, TS-17 (F8)    |
| D8  | **Sincronización de sala.** Sin backend con WebSockets, "sincronizado" no es real.                                                                                                                                                                     | (a) sala de un solo usuario, miembros fake / (b)`BroadcastChannel`/`localStorage` entre pestañas / (c) UI y contrato listos, sync real fuera del sprint.            | TS-15, TS-18         |
| D9  | **Permisos extra del creador de playlist.** El plan mock solo restringe eliminar canciones; B8 también reserva al creador editar nombre/descripción y borrar la playlist.                                                                             | Adoptar regla de B8 (propuesta, es la más estricta) / solo eliminar canciones.                                                                                          | TS-12                |
| D10 | **Ruta de invitación.** `/playlists/join/:token` vs `/playlists/invitar/:token`.                                                                                                                                                                   | Elegir una y usarla en`AppRoutes.jsx` y en el link generado. Propuesta: `/playlists/invitar/:token` (consistente con rutas en español como `/perfil/seguidores`). | TS-13                |
| D11 | **Invitación ya generada.** Si el creador pide otro link y ya existe uno.                                                                                                                                                                              | `409` / `200` con el mismo enlace.                                                                                                                                   | TS-13 (B6)           |
| D12 | **Estado real de TS-10 en la búsqueda.** El plan mock dice que `UserRow` (con botón seguir) se usa en `SearchPeople`; F10 dice que la búsqueda no muestra estado de seguimiento. Probable causa: lo primero es mock, lo segundo es backend real. | Verificar contra el código antes de TS-10b.                                                                                                                             | TS-10b               |

**Decisión ya tomada:** orden cronológico de recomendaciones = **más reciente primero** (definido en B1; reemplaza el "definir y ser consistente" del plan mock).

---

## TS-10 — Seguir personas (feature 7, 25%)

**Contexto:** el usuario puede seguir/dejar de seguir a otros usuarios registrados. Acción unilateral (no requiere aprobación, como Instagram).
**Alcance:**

- Botón seguir/dejar de seguir en perfil público (`features/profile/ProfilePublic.jsx`, ya existe de TS-05 — extender, no recrear). `ProfileView.jsx` es el perfil propio y también muestra los contadores.
- Ver lista de seguidores y de seguidos (propios y de terceros).

**Archivos:** extender `src/services/usersService.js` con `followUser(followerId, followingId)`, `unfollowUser(followerId, followingId)`, `isFollowing(a, b)`, `getFollowCounts(userId)`, `listFollowers(userId)`, `listFollowing(userId)`. Extender `mocks/users.js` con relaciones de seguimiento (array de pares `{followerId, followingId}`).
**Criterios de aceptación:**

- [X] Seguir es inmediato, sin aprobación.
- [X] Botón cambia de estado visual según si ya sigo o no a esa persona.
- [X] Contadores de Seguidores/Seguidos pasan a leer datos reales del usuario logueado. El Sidebar implementado no traía esa tarjeta con números fijos; se agregó `features/social/ProfileSummary.jsx` en `SidebarFooter` y los contadores también viven en `ProfileView` y `ProfilePublic`.

**Dependencias:** TS-05 (perfil).

**Estado: entregado (capa mock).**

- `mocks/users.js` → `mockFollows` (semilla: la cuenta demo `u1` queda con 7 seguidores y 3 seguidos; sin auto-follow).
- `services/usersService.js` → persistencia en `localStorage` bajo `synthos_mock_follows`, con la misma política de siembra que los usuarios. Las firmas pasan ids explícitos en vez de leer la sesión, porque `authService` ya importa este módulo y leerla acá crearía un ciclo de imports.
- `features/social/useFollow.js` → un solo hook por pantalla; `FollowButton` y `FollowStats` son presentacionales y reciben estado por props. Follow/unfollow optimista con reversión en error.
- `features/social/FollowButton.jsx`, `FollowStats.jsx`, `ProfileSummary.jsx`, `FollowList.jsx`; fila reutilizable en `components/cards/UserRow.jsx` (también usada por `SearchPeople` de TS-08).
- Rutas: `/perfil/seguidores`, `/perfil/siguiendo`, `/profile/:id/seguidores`, `/profile/:id/siguiendo`. La relación se pasa por prop (no por param) para que una URL inválida no muestre una lista equivocada.
- Verificación: 19 casos de service (inmediatez, idempotencia, self-follow, usuario inexistente, contadores, listas sin `password`, persistencia), smoke SSR de rutas y piezas nuevas, `npm run build` y `npm run lint` sin warnings nuevos.
- Decisión: `unfollowUser(x, x)` es un no-op (el CHECK de la tabla impide *crear* la relación, no borrarla); el botón nunca se muestra sobre el propio perfil, así que la UI no lo llama.

---

## TS-10b — Mostrar a quién ya sigo en la búsqueda de personas (ex B4 + F10)

**Contexto:** al buscar personas, la lista debe indicar de un vistazo a cuáles ya sigo, sin entrar al perfil de cada una.
**Antes de empezar:** resolver **D12** (verificar si `SearchPeople` ya muestra el estado en la capa real).

**Backend (B4)**

- **Endpoint:** modificar `GET /api/users/search`: con sesión iniciada, cada resultado agrega si el usuario que busca ya lo sigue.
- **Respuesta:** misma estructura actual (lista paginada con nombre, foto, biografía y género más escuchado) + indicador de seguimiento por persona.
- **Códigos:** los actuales (`200` y errores ya manejados); `401` solo si se pide explícitamente el dato autenticado y no hay sesión.
- **Necesita:** tabla de seguimiento; endpoint existente de búsqueda.
- **Criterios de aceptación:**
  - [ ] La respuesta incluye el indicador por persona.
  - [ ] Con muchos resultados sigue siendo **una sola consulta** (no una por persona).
  - [ ] La búsqueda sigue funcionando igual para el resto de los campos.

**Frontend (F10)**

- **Componente:** fila de resultado en búsqueda de personas (`components/cards/UserRow.jsx` / `SearchPeople`, ya existe; ajustar). **Revisar: ya existe parcialmente.**
- **Endpoint:** usa B4.
- **Falta:** mostrar indicador o botón de seguir en cada fila según la respuesta; mantenerlo sincronizado si el usuario empieza o deja de seguir desde el resultado; estado de carga; búsqueda sin resultados; paginación como hasta ahora.
- **Criterios de aceptación:**
  - [ ] Cada resultado indica si ya sigo a esa persona.
  - [ ] Al seguir o dejar de seguir desde la lista, el indicador se actualiza sin recargar.
  - [ ] Paginación y búsqueda siguen funcionando como hasta ahora.

**Dependencias:** TS-10.

---

## TS-11 — Calificar positivamente al anfitrión (feature 15, 50%)

**Contexto:** dentro de una sala, los participantes pueden calificar positivamente al anfitrión (ej. una estrella/like). Se acumula en su perfil.
**Alcance:**

- Solo participantes de esa sala pueden calificar.
- Una calificación por participante por sala (no repetible).
- El anfitrión no califica a nadie.

**Archivos:** `src/services/roomsService.js` → `rateHost(roomId)`. Campo `hostRating` agregado al modelo de usuario en `mocks/users.js` (acumulado).
**Backend:** **no hay endpoint para crear calificaciones** (tabla y vista de promedio existen, datos solo del seed). Propuesta **B10** (no estaba en el alcance pedido, pendiente de **D5**): `POST /api/rooms/:id/rating`, con `401` sin sesión, `403` si no es participante o es el anfitrión, `409` si ya calificó esa sala, `404` si la sala no existe. Criterio de "positiva" según **D6**.
**Criterios de aceptación:**

- [ ] Botón de calificar deshabilitado/oculto para el propio anfitrión.
- [ ] Un participante no puede calificar dos veces en la misma sala (bloqueo en el mock, no solo en UI; en backend, si se aprueba B10).
- [ ] Calificación acumulada visible en perfil del anfitrión.

**Dependencias:** TS-14 (Crear sala) — depende conceptualmente de que exista una sala con participantes, pero el contrato de servicio puede escribirse antes.

---

## TS-12 — Crear playlist colaborativa (feature 19, 50%)

**Contexto:** el usuario crea una playlist marcada como colaborativa. Él es el creador original.
**Alcance:**

- Crear playlist colaborativa (extensión de playlist normal, TS-09, con flag `isCollaborative` + `ownerId`).
- Participantes agregan canciones.
- **Solo el creador original elimina canciones** — participantes no pueden eliminar, solo agregar. (Reglas adicionales del creador: ver **D9**.)

**Archivos (frontend):** extender `src/services/playlistsService.js` con `createCollaborativePlaylist(data)`, `addSongToPlaylist(playlistId, songId)` (ya puede existir de TS-09, verificar permisos), `removeSongFromPlaylist(playlistId, songId)` (debe validar `ownerId === currentUser.id`).

### Backend

**B5 — Crear playlist colaborativa** (**Revisar: ya existe parcialmente**: el modelo tiene el tipo "colaborativa" y la tabla de miembros con rol creador/colaborador; el endpoint no los usa)

- **Endpoint:** modificar `POST /api/playlists` (aceptar playlist colaborativa).
- **Respuesta:** igual que hoy, indicando que es colaborativa y quién es el creador.
- **Códigos:** `201`, `400`, `401`; además `400` si el tipo de playlist no es válido.
- **Criterios de aceptación:**
  - [ ] Se puede crear una playlist marcada como colaborativa.
  - [ ] Al consultarla se identifica como colaborativa y se ve su creador.
  - [ ] Las playlists normales se crean igual que hasta ahora.

**B8 — Aplicar permisos de playlist colaborativa** (**Revisar: ya existe parcialmente**: hoy la edición no valida membresía ni rol)

- **Endpoint:** modificar `PUT /api/playlists/:id` y `DELETE /api/playlists/:id`.
- **Respuesta:** misma estructura que hoy.
- **Códigos:** los actuales + `403` cuando un participante intenta algo reservado al creador (quitar canciones, y según D9, editar nombre/descripción o borrar la playlist) o cuando alguien sin relación intenta editarla.
- **Necesita:** B5, B7; tabla de miembros con roles.
- **Criterios de aceptación:**
  - [ ] Un participante agrega canciones sin problema y recibe error al intentar quitar una.
  - [ ] El creador puede todo.
  - [ ] Un usuario sin relación con la playlist recibe error al intentar editarla.

### Frontend

**F4 — Crear playlist colaborativa** (formulario de creación, ya existe; ajustar. **Revisar: ya existe parcialmente**: no distingue tipo)

- **Endpoint:** usa B5.
- **Falta:** opción clara "colaborativa" con explicación breve de qué implica; validaciones iguales a las actuales (nombre obligatorio, etc.); botón deshabilitado mientras se crea; manejo de error del servidor.
- **Criterios de aceptación:**
  - [ ] Puedo crear una playlist colaborativa y aparece en mi lista identificada como tal.
  - [ ] Las playlists normales se crean igual que antes.

**F7 — Ajustar el detalle de la playlist a la colaboración** (detalle y fila de canción, ya existen; ajustar. **Revisar: ya existe parcialmente**: asumen una única persona dueña)

- **Endpoint:** usa B8 (y los endpoints existentes de consulta).
- **Falta:** ocultar/deshabilitar borrado y edición para quienes no son el creador; mostrar marca de colaborativa y rol del usuario actual; mensajes cuando el servidor rechaza (403); lista de participantes si el detalle la trae.
- **Criterios de aceptación:**
  - [ ] **UI oculta/deshabilita el botón eliminar canción para quien no es el creador original.**
  - [ ] **Participante puede agregar canciones sin restricción** (ve agregar, no quitar).
  - [ ] El creador ve ambas cosas.
  - [ ] Un usuario sin relación no ve acciones de edición.
  - [ ] Si el servidor rechaza algo, el usuario entiende por qué.

**Dependencias:** TS-09 (Playlists personales, Sprint 1).

---

## TS-13 — Invitar usuarios a playlist colaborativa (feature 20, 50%)

**Contexto:** el creador de una playlist colaborativa genera un link de invitación. Quien entra con ese link se une como participante (solo agrega, no elimina).
**Alcance:**

- Generar link de invitación (solo visible/generable por el creador).
- Pantalla/flujo de "unirse a playlist" vía ese link.

**Archivos (frontend):** `src/services/playlistsService.js` → `generateInviteLink(playlistId)`, `joinPlaylistByInvite(token)`. Ruta nueva en `AppRoutes.jsx` (según **D10**).

### Backend

**B6 — Generar enlace de invitación**

- **Endpoint:** `POST /api/playlists/:id/invitation`.
- **Respuesta:** `200` con enlace/código (y fecha de expiración si se define).
- **Códigos:** `200`; `401` sin sesión; `403` si no es el creador; `404` si la playlist no existe; `400` si no es colaborativa; si ya existía un enlace: `409` o `200` con el mismo (**D11**).
- **Necesita:** campo de token de invitación ya reservado en el modelo (sin usar); rol creador en tabla de miembros.
- **Criterios de aceptación:**
  - [ ] Solo el creador recibe el enlace; un usuario normal es rechazado.
  - [ ] El enlace es usable por B7.

**B7 — Unirse por enlace de invitación**

- **Endpoint:** `POST /api/playlists/join` (recibe enlace o código).
- **Respuesta:** `200` con la playlist y confirmación de que el usuario ahora es participante.
- **Códigos:** `200` unido (o ya era miembro, sin romper); `400` si falta o es inválido el código; `401` sin sesión; `404` si el código no corresponde a ninguna playlist.
- **Necesita:** B6; tabla de miembros con rol colaborador. Permisos se aplican en B8.
- **Criterios de aceptación:**
  - [ ] Con enlace válido el usuario queda como miembro y aparece en participantes.
  - [ ] Si ya era miembro, no se duplica.
  - [ ] Enlace inválido o inexistente recibe error claro.

### Frontend

**F5 — Generar y compartir el enlace**

- **Componente:** botón y mensaje "Invitar" en el detalle de la playlist colaborativa (componente pequeño nuevo).
- **Endpoint:** usa B6.
- **Casos:** botón solo visible/habilitado para el creador; deshabilitado mientras genera; confirmación visible de copia al portapapeles; error si falla; si el enlace ya existía, se reutiliza.
- **Criterios de aceptación:**
  - [ ] **Solo el creador ve/genera el link.**
  - [ ] El enlace queda copiado y funciona con F6.

**F6 — Aceptar invitación y unirse**

- **Componente:** pantalla de aceptación (ruta nueva, **D10**) con resumen de la playlist y botón de unirse.
- **Endpoint:** usa B7.
- **Casos:** token inválido/inexistente con mensaje claro; sin sesión → login y retorno a la invitación; botón deshabilitado mientras procesa; si ya era miembro, mensaje de que ya forma parte; tras unirse, acceso al detalle.
- **Criterios de aceptación:**
  - [ ] **Usuario que entra por el link queda como participante (no creador), con permisos de TS-12.**
  - [ ] **Link inválido/expirado (mock: token no encontrado) muestra error claro, no rompe la app ni deja pantalla en blanco.**

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
**Backend:** no definido en ningún documento de origen (solo existe `GET /api/rooms`). Capa mock en este sprint.
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
**Backend:** no definido en los documentos de origen.
**Criterios de aceptación:**

- [ ] Solo el anfitrión ve controles de administración (kick, control reproducción).
- [ ] Miembro expulsado pierde acceso a la sala (mock: ya no aparece en su lista de salas activas).

**⚠️ Bloqueada por D8** (sincronización).
**Dependencias:** TS-14.

---

## TS-16 — Buscar salas de escucha (feature 18, 75%)

**Contexto:** buscar salas por nombre de sala o nombre de usuario (anfitrión), con orden ascendente/descendente.
**Alcance:**

- Input de búsqueda + selector de orden (asc/desc).
- Resultados vacíos → mensaje informativo, no pantalla en blanco.

**Archivos:** `src/features/search/SearchRooms.jsx`. Extender `roomsService.js` con `searchRooms(query, sortOrder)`.
**Backend:** `GET /api/rooms` **ya existe** y soporta orden por calificación. Verificar si cubre búsqueda por texto y por nombre de anfitrión (**D7**).
**Criterios de aceptación:**

- [ ] Búsqueda funciona por nombre de sala Y por nombre de usuario anfitrión.
- [ ] Selector asc/desc cambia el orden visiblemente.
- [ ] Estado vacío manejado.

**Dependencias:** TS-14.

---

## TS-17 — Ordenar salas por calificación del anfitrión + conectar listado al backend (feature 16, 25%; ex F8)

**Contexto:** al buscar salas públicas, ordenar resultados por calificación del anfitrión (mejor calificado primero). Calificación visible en la tarjeta de sala. Hoy el frontend usa datos ficticios; el listado debe venir del backend real.
**Alcance:**

- Extiende TS-16: criterio de orden adicional "por calificación de anfitrión" junto a asc/desc por nombre.
- **F8:** conectar el servicio y la pantalla de listado a `GET /api/rooms` (sin ID de backend nuevo, el endpoint ya existe).

**Archivos:** extender `searchRooms()` en `roomsService.js` con parámetro de criterio de orden. Mostrar `hostRating` (de TS-11) en la tarjeta de sala.
**Falta (F8):** **Inconsistencia: la funcionalidad existe solo en frontend con datos ficticios.** Quitar el modo de prueba del servicio; mapear la respuesta real a la forma que usa la UI (**D7**); estado de carga y de error propios de llamada real; manejar salas sin calificación; verificar que el orden del servidor se respeta sin reordenar en el navegador.
**Criterios de aceptación:**

- [ ] Nueva opción de orden "Mejor calificado" disponible junto a asc/desc.
- [ ] Calificación del anfitrión visible en cada card de resultado (o "Sin calificar").
- [ ] Ordenar por "Mejor calificado" funciona con datos del servidor.
- [ ] La vista ficticia ya no se usa.

**Dependencias:** TS-11 (Calificar anfitrión), TS-16 (Buscar salas). Criterio de "positiva": **D6**.

---

## TS-18 — Votar para saltar canción (feature 12, 75%)

**Contexto:** en una sala, un miembro no-administrador puede iniciar votación para saltar la canción actual. Se aprueba por mayoría de miembros presentes. Cada miembro vota una vez por canción. El admin no vota; si el admin salta directamente, cancela cualquier votación en curso.
**Alcance:**

- Botón "votar para saltar" visible solo para no-administradores.
- Contador de votos visible, resolución automática al alcanzar mayoría.
- Reset del contador al cambiar de canción.

**Archivos:** `src/services/roomsService.js` → `voteSkip(roomId)`, `getSkipVoteStatus(roomId)`.
**Backend:** no definido en los documentos de origen.
**Criterios de aceptación:**

- [ ] Administrador no ve/no puede usar el botón de votar.
- [ ] Un miembro no puede votar dos veces por la misma canción.
- [ ] Acción directa de "saltar" del admin cancela la votación en curso.
- [ ] Aplica la misma decisión de sincronización que TS-15 (**D8**).

**Dependencias:** TS-15.

---

## TS-19 — Recomendar canciones a personas (feature 8, 50%)

**Contexto:** usuarios que se siguen mutuamente pueden dejarse recomendaciones (canción + texto) en el perfil del otro, visibles cronológicamente. Quien envía solo ve sus propias recomendaciones enviadas; el dueño del perfil ve todas las que recibió.
**Alcance:**

- Formulario de recomendación (elegir canción + texto) disponible solo si hay seguimiento mutuo.
- Listado cronológico (**más reciente primero**) en el perfil.

**Archivos (frontend):** `src/services/recommendationsService.js` (ya estaba en el árbol de AGENTS.md, implementar ahora) → `createRecommendation(toUserId, songId, text)`, `listRecommendationsReceived(userId)`, `listRecommendationsSent(userId)`.
**Bloqueada en backend por D1 y D2.**

### Backend

**B1 — Listar recomendaciones de un perfil**

- **Endpoint:** `GET /api/users/:id/recommendations`.
- **Respuesta:** lista de más reciente a más antigua. Cada una con: texto, fecha, canción (título, artista, carátula), emisor (nombre, foto) y, si corresponde, si le gustó o no al receptor.
- **Códigos:** `200` con lista (aunque vacía); `404` si el usuario no existe; `401` sin sesión; `500` error del servidor.
- **Necesita:** tablas de contenido (`content`), usuarios, seguimiento, relación con canciones. Ver D1.
- **Regla:** dueño del perfil ve todas las recibidas; un emisor ve solo las que él hizo hacia esa persona; visitante externo según D2.
- **Criterios de aceptación:**
  - [ ] El dueño ve todas las recibidas en orden cronológico.
  - [ ] Un usuario que recomendó hacia ese perfil ve solo la suya.
  - [ ] Incluye los datos de la canción (sin llamadas extra).

**B2 — Crear una recomendación**

- **Endpoint:** `POST /api/recommendations`.
- **Respuesta:** `201` con la recomendación (texto, fecha, canción, emisor y receptor).
- **Códigos:** `201`; `400` si falta texto o canción, o texto vacío; `401` sin sesión; `403` si no hay seguimiento mutuo; `404` si receptor o canción no existen.
- **Necesita:** tablas de contenido, usuarios, seguimiento, canciones. Misma regla de destinatario que B1 (D1).
- **Regla:** solo con seguimiento mutuo. Si yo la sigo pero ella no me sigue, no puedo recomendarle.
- **Criterios de aceptación:**
  - [ ] Se puede recomendar a alguien que me sigue y a quien sigo.
  - [ ] Sin seguimiento mutuo se rechaza con mensaje claro.
  - [ ] La recomendación aparece en el perfil del receptor (B1).

### Frontend

**F1 — Recomendar desde el perfil de otra persona**

- **Componente:** formulario dentro del perfil público (nuevo, carpeta de perfil o recomendaciones); buscador de canciones reutilizando la lógica de búsqueda existente.
- **Endpoint:** usa B2.
- **Casos:** enviar deshabilitado mientras procesa y si falta canción o texto; mensajes de éxito/error (en especial "no hay seguimiento mutuo", explicando por qué); texto con longitud máxima; cancelar/limpiar; búsqueda de canciones con estado vacío y de carga.
- **Criterios de aceptación:**
  - [ ] **Formulario oculto (o deshabilitado con explicación) si no hay follow mutuo** (usa TS-10).
  - [ ] Con seguimiento mutuo se envía y se ve confirmación.
  - [ ] Errores del servidor en lenguaje entendible.

**F2 — Ver recomendaciones en el perfil**

- **Componente:** sección de recomendaciones del perfil (propio y público), reutilizando avatar y tarjeta de canción.
- **Endpoint:** usa B1.
- **Casos:** carga (esqueleto/spinner); lista vacía con mensaje amigable; error de red con reintento; datos del perfil y de la lista no se pisan; móvil y desktop.
- **Criterios de aceptación:**
  - [ ] **Orden cronológico consistente, más reciente primero.**
  - [ ] **Visibilidad respetada:** dueño ve todo, emisor ve solo lo suyo en perfil ajeno.
  - [ ] Canciones con título, artista y carátula sin llamadas extra.

**Dependencias:** TS-10 (Seguir personas).

---

## TS-20 — Recomendaciones por estado de ánimo con IA (feature 14, 50%)

**Contexto:** el usuario pide recomendaciones de música según su estado de ánimo, detectado por escaneo facial con IA (alegría, tristeza, calma, etc.).

**⚠️ Bloqueada por D4** (quién detecta la emoción). Sin esa decisión no se pueden fijar criterios finales de detección. El endpoint de canciones por ánimo no depende de ella.

### Backend

**B9 — Canciones por estado de ánimo**

- **Endpoint:** `GET /api/songs/mood` (recibe el estado detectado).
- **Respuesta:** lista de canciones con título, artista, carátula y datos de reproducción, formato similar a otras listas de canciones.
- **Códigos:** `200` (aunque vacía); `400` si el estado no es válido; `500` error del servidor.
- **Necesita:** tabla de estados de ánimo y su relación con canciones (ya existen en el esquema y seed). No depende de otras tareas.
- **Nota:** el endpoint solo recibe el resultado de la detección y devuelve música.
- **Criterios de aceptación:**
  - [ ] Cada estado válido devuelve canciones del catálogo.
  - [ ] Estado inválido recibe error claro.
  - [ ] Respuesta con datos suficientes para reproducir y mostrar.

### Frontend

**F9 — Pantalla de escaneo y recomendaciones**

- **Componente:** nueva feature con ruta nueva accesible desde menú o inicio.
- **Qué hace:** activa la cámara, detecta el ánimo y muestra canciones recomendadas, reproducibles al instante.
- **Endpoint:** usa B9 para canciones; la detección depende de D4.
- **Casos:** permiso de cámara denegado con explicación y salida limpia; cámara no disponible (desktop sin webcam); ningún estado detectado con mensaje de reintento; carga durante detección y búsqueda; lista vacía para algún ánimo; volver a escanear; reproducir usa el reproductor global.
- **Criterios de aceptación:**
  - [ ] Flujo completo de punta a punta (cámara → ánimo → canciones → reproducir).
  - [ ] Si se decide otro modo de detección (D4), la pantalla se adapta sin cambiar el resto de la experiencia.
  - [ ] Permisos y errores de cámara se manejan sin dejar la app rota.

**Dependencias:** ninguna técnica dura, bloqueada por D4.

---

## TS-21 — Subir foto de perfil desde dispositivo o cámara (ex B3 + F3)

**Contexto:** el usuario elige una imagen de su dispositivo o toma una foto, la previsualiza y la guarda como foto de perfil. Sin foto elegida se mantiene el avatar por defecto.
**Bloqueada en backend por D3** (almacenamiento).

**Backend (B3)**

- **Endpoint:** `POST /api/users/me/picture` (recibe archivo de imagen).
- **Respuesta:** `200` con la URL pública de la imagen guardada.
- **Códigos:** `200`; `400` si no viene archivo, formato no permitido o supera el tamaño máximo; `401` sin sesión; `500` si falla el guardado.
- **Necesita:** solución de almacenamiento (D3). El endpoint existente de editar perfil ya acepta una URL de foto: esta tarea solo agrega la subida.
- **Criterios de aceptación:**
  - [ ] Imagen válida se sube y la URL devuelta muestra la foto en el navegador.
  - [ ] Archivos que no son imagen o exceden el máximo se rechazan con mensaje claro.

**Frontend (F3)**

- **Componente:** formulario de edición de perfil (ya existe; ajustar). **Revisar: ya existe parcialmente**: hoy la foto se lee como texto enorme y se manda dentro del JSON de edición; puede fallar y no persiste como archivo real.
- **Endpoint:** usa B3.
- **Falta:** enviar el archivo al endpoint; validar tipo y tamaño antes de enviar; progreso; errores claros; no permitir guardar si la subida falló; habilitar cámara donde el dispositivo lo soporte.
- **Criterios de aceptación:**
  - [ ] La foto se sube como archivo y aparece en el perfil y en el resto de la app (ej. junto al nombre en la barra lateral).
  - [ ] Imagen demasiado grande o formato no permitido: mensaje claro.
  - [ ] Sin foto: avatar por defecto.
  - [ ] Guardar sin tocar la foto no rompe nada.

**Dependencias:** TS-05 (perfil).

---

## Orden de ejecución sugerido para el agente

1. TS-10 (entregada) → TS-10b (B4 → F10, tras verificar D12)
2. TS-12 (B5 → B8 → F4 → F7) → TS-13 (B6 → B7 → F5 → F6)
3. TS-19 (B1 → B2 → F2 → F1), tras resolver D1 y D2
4. TS-14 → TS-11 → TS-16 → TS-17 (F8 incluido); D5, D6 y D7 antes de cerrar TS-11/TS-17
5. TS-15 → TS-18, **solo tras resolver D8**
6. TS-21 (B3 → F3), tras resolver D3
7. TS-20 (B9 → F9), **en espera de D4**

> Nota: B8 requiere B7 (necesita roles de colaborador reales). Si el agente prefiere, B5, B6, B7 y B8 pueden implementarse seguidos en backend y luego F4–F7 en frontend.
