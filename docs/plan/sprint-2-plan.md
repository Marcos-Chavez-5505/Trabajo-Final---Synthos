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
| D1  | **Destinatario de una recomendación.** El modelo de contenido guarda autor, texto, canción y fecha, pero no destinatario.                                                                                                                             | **resuelta:** en `content_playement` (`recommendation.service.js`). Sin campo nuevo.                                                                                  | TS-19 (B1, B2)       |
| D2  | **Visitante externo** (ni emisor ni receptor): ¿ve las recomendaciones en el perfil público?                                                                                                                                                          | **resuelta: No.** `getRecommendationsForProfile` filtra por `idAuthor: viewerId` cuando el visor no es el dueño, así que un tercero recibe `[]`. Dueño ve todas las recibidas, emisor solo las suyas. | TS-19 (B1, F2)       |
| D3  | **Almacenamiento de fotos de perfil.** No hay infraestructura de subida. El despliegue es en Vercel, **el disco local no persiste**: favorece servicio externo.                                                                                   | **resuelta (2026-10-13):** servicio en nube **ImageKit** + endpoint dedicado `POST /api/users/me/picture` (multipart) + recorte/recompresión en el cliente. Ver TS-21. | TS-21 (B3)           |
| D4  | **Detección de estado de ánimo** (escaneo facial con IA). No hay código ni dependencias de IA.                                                                                                                                                       | **resuelta (2026-10-14): detección en el navegador** con face-api.js 0.22.2 desde CDN, cargado bajo demanda, modelo `tiny` (`tinyFaceDetector` + `faceExpressionNet`), y las 7 expresiones reducidas a los 3 estados del catálogo. Sin dependencia npm y sin backend; si el CDN no responde, la pantalla cae al selector manual. | TS-20 (F9)           |
| D5  | **Crear calificaciones de anfitrión.** Existe la tabla y la vista de promedio, pero **no hay endpoint para crear**; los datos vienen del seed.                                                                                                   | Agregar tarea backend (propuesta B10 en TS-11) / dejar solo seed.                                                                                                        | TS-11 en producción |
| D6  | **"Calificaciones positivas".** El alcance dice positivas, la vista actual promedia todas.                                                                                                                                                              | Promedio de todas / solo positivas (ej. 4 a 5).                                                                                                                          | TS-11, TS-17         |
| D7  | **Respuesta real de `GET /api/rooms`.** El modelo de sala no tiene campo de anfitrión (se infiere por rol en la sala). Verificar que incluya nombre y calificación del anfitrión.                                                                  | Verificar / ajustar endpoint.                                                                                                                                            | TS-16, TS-17 (F8)    |
| D8  | **Sincronización de sala.** Sin backend con WebSockets, "sincronizado" no es real.                                                                                                                                                                     | (a) sala de un solo usuario, miembros fake / (b)`BroadcastChannel`/`localStorage` entre pestañas / (c) UI y contrato listos, sync real fuera del sprint.            | TS-15, TS-18         |
| D9  | **Permisos extra del creador de playlist.** El plan mock solo restringe eliminar canciones; B8 también reserva al creador editar nombre/descripción y borrar la playlist.                                                                             | **resuelta: regla de B8** (la más estricta). `PUT /:id` y `DELETE /:id` dan 403 a todo lo que no sea `idCreator`.                                                                                                                    | TS-12                |
| D10 | **Ruta de invitación.** `/playlists/join/:token` vs `/playlists/invitar/:token`.                                                                                                                                                                   | **resuelta: `/playlists/join/:token`** (lo que implementó el backend). **Ojo:** el link que arma `generateInvitation` apunta a `${FRONTEND_URL}/join/<token>`, que es una ruta distinta y hoy no existe en `AppRoutes`. | TS-13                |
| D11 | **Invitación ya generada.** Si el creador pide otro link y ya existe uno.                                                                                                                                                                              | **resuelta: regenera el token** en cada pedido (sin `409`), así que los links anteriores quedan inválidos.                                                                                                                          | TS-13 (B6)           |
| D12 | **Estado real de TS-10 en la búsqueda.** El plan mock dice que `UserRow` (con botón seguir) se usa en `SearchPeople`; F10 dice que la búsqueda no muestra estado de seguimiento. Probable causa: lo primero es mock, lo segundo es backend real. | **resuelta (verificado contra el código):** `UserRow` es un `<Link>` plano sin botón (también en `FollowList`); `SearchPeople` no muestra el estado. El plan-mock no se cumple → TS-10b es trabajo real. | TS-10b |

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
  - [X] La respuesta incluye el indicador por persona.
  - [X] Con muchos resultados sigue siendo **una sola consulta** (no una por persona).
  - [X] La búsqueda sigue funcionando igual para el resto de los campos.

**Frontend (F10)**

- **Componente:** fila de resultado en búsqueda de personas (`components/cards/UserRow.jsx` / `SearchPeople`, ya existe; ajustar). **Revisar: ya existe parcialmente.**
- **Endpoint:** usa B4.
- **Falta:** mostrar indicador o botón de seguir en cada fila según la respuesta; mantenerlo sincronizado si el usuario empieza o deja de seguir desde el resultado; estado de carga; búsqueda sin resultados; paginación como hasta ahora.
- **Criterios de aceptación:**
  - [X] Cada resultado indica si ya sigo a esa persona.
  - [X] Al seguir o dejar de seguir desde la lista, el indicador se actualiza sin recargar.
  - [X] Paginación y búsqueda siguen funcionando como hasta ahora.

**Dependencias:** TS-10.

**Estado: entregado (B4 + F10).**

- B4: `GET /api/users/search` con auth **opcional** (`optionalAuthenticate`); con sesión cada ítem agrega la relación **en los dos sentidos** — `isFollowing` (el que busca lo sigue) y `followsMe` (esa persona lo sigue a él) — resuelta con dos `EXISTS` en la misma query de búsqueda (verificado contra la base real: anónimo sin campos; con sesión ambos campos aparecen y reflejan el estado real tras `POST`/`DELETE /follow`).
- F10: `searchUsers` mapea `isFollowing` y `followsMe` por resultado; `UserRow` acepta un slot `action` (fuera del link, sin interactivos anidados); `FollowButton` generaliza su wrapper con prop `className`; nueva `features/search/SearchPersonRow.jsx` con toggle optimista (reversión en error, `pending` bloquea, el error se muestra bajo el botón con el mensaje del service) y badge "Te sigue" cuando `followsMe`. Al repaginar las filas se remontan (`key = página-persona`) con el estado fresco de la respuesta.

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

**Sin cambios: sigue pendiente.** Lo único que ya existe es la **visualización** del promedio del anfitrión
(`RoomCard` con `hostRating` / "Sin calificar", alimentado por `avg_rating` de `GET /api/rooms`) y la vista
`host_avg_rating` que creó la migración `20261013164336`. **D5 sigue abierta:** no hay `POST /api/rooms/:id/rating`
(`room.routes.js` solo expone `GET /`), ni `rateHost` en `roomsService`, ni botón. **D6 sigue abierta:** el promedio
actual es `AVG(rating)` sobre todas las calificaciones, no solo las positivas. El tercer criterio ("visible en el
perfil del anfitrión") tampoco se cumple: los perfiles (`ProfileView`, `ProfilePublic`) no muestran calificación.

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
  - [x] Se puede crear una playlist marcada como colaborativa.
  - [x] Al consultarla se identifica como colaborativa y se ve su creador.
  - [x] Las playlists normales se crean igual que hasta ahora.

**B5: entregada en backend.** `playlist.service.js::createPlaylist` recibe `type` y normaliza a `colab` /
`personal`; el `creator` viene en `PLAYLIST_INCLUDE`, así que la respuesta 201 ya identifica el tipo y el creador.
**Desviación:** un `type` desconocido **no da 400** — cae en `personal` silenciosamente. Si se quiere el 400 del
plan, hay que validar el tipo en el controller antes de llamar al service.

**B8 — Aplicar permisos de playlist colaborativa** (**Revisar: ya existe parcialmente**: hoy la edición no valida membresía ni rol)

- **Endpoint:** modificar `PUT /api/playlists/:id` y `DELETE /api/playlists/:id`.
- **Respuesta:** misma estructura que hoy.
- **Códigos:** los actuales + `403` cuando un participante intenta algo reservado al creador (quitar canciones, y según D9, editar nombre/descripción o borrar la playlist) o cuando alguien sin relación intenta editarla.
- **Necesita:** B5, B7; tabla de miembros con roles.
- **Criterios de aceptación:**
  - [ ] Un participante agrega canciones sin problema y recibe error al intentar quitar una.
  - [ ] El creador puede todo.
  - [ ] Un usuario sin relación con la playlist recibe error al intentar editarla.

**B8: parcial — por eso nada se tacha.** `PUT /:id` y `DELETE /:id` validan `existing.idCreator !== userId → 403`
(la regla estricta de **D9**, ya resuelta), así que el criterio de "usuario sin relación recibe error" se cumple por
el mismo camino. Lo que **no** existe es la parte de colaboradores: `PUT` no mira `PlaylistMember`, así que un
participante que se unió por invitación recibe **403 al agregar canciones** (el primer criterio del bloque) y no hay
ningún 403 específico para "quitar canciones" como evento distinguible. Al crear la playlist tampoco se inserta la
fila `PlaylistMember` con rol `creator` (solo `idCreator` en `Playlist`); los roles `colaborator` los crea B7 al unirse.

### Frontend

**F4 — Crear playlist colaborativa** (formulario de creación, ya existe; ajustar. **Revisar: ya existe parcialmente**: no distingue tipo)

- **Endpoint:** usa B5.
- **Falta:** opción clara "colaborativa" con explicación breve de qué implica; validaciones iguales a las actuales (nombre obligatorio, etc.); botón deshabilitado mientras se crea; manejo de error del servidor.
- **Criterios de aceptación:**
  - [ ] Puedo crear una playlist colaborativa y aparece en mi lista identificada como tal.
  - [ ] Las playlists normales se crean igual que antes.

**F4: pendiente.** El backend ya acepta `type`, pero `playlistsService.createPlaylist(ownerId, { name, description })`
no manda `type` y `PlaylistCreateForm.jsx` no ofrece la opción. Sin este ítem la feature queda inalcanzable desde la UI.

**F7 — Ajustar el detalle de la playlist a la colaboración** (detalle y fila de canción, ya existen; ajustar. **Revisar: ya existe parcialmente**: asumen una única persona dueña)

- **Endpoint:** usa B8 (y los endpoints existentes de consulta).
- **Falta:** ocultar/deshabilitar borrado y edición para quienes no son el creador; mostrar marca de colaborativa y rol del usuario actual; mensajes cuando el servidor rechaza (403); lista de participantes si el detalle la trae.
- **Criterios de aceptación:**
  - [ ] **UI oculta/deshabilita el botón eliminar canción para quien no es el creador original.**
  - [ ] **Participante puede agregar canciones sin restricción** (ve agregar, no quitar).
  - [ ] El creador ve ambas cosas.
  - [ ] Un usuario sin relación no ve acciones de edición.
  - [ ] Si el servidor rechaza algo, el usuario entiende por qué.

**F7: pendiente.** `PlaylistDetail.jsx` y `PlaylistSongRow.jsx` siguen asumiendo una única persona dueña: no
distinguen una playlist `colab`, no leen los `members` que ya llegan en `PLAYLIST_INCLUDE`, y el borrado de canción
se muestra sin mirar el rol (el backend igual lo rechaza con 403 por `idCreator`).

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
  - [x] Solo el creador recibe el enlace; un usuario normal es rechazado.
  - [x] El enlace es usable por B7.

**B6: entregada en backend.** `POST /api/playlists/:id/invitation` valida id, existencia, `idCreator` (403) y
`type === "colab"` (400), y devuelve `201 { status, token, link }`. **Dos desviaciones:** el plan decía `200` y
devuelve `201`; y por **D11** cada pedido regenera el token (`crypto.randomBytes`), invalidando los links previos.
El `link` se arma con `process.env.FRONTEND_URL`, que **no está en `.env.example`**.

**B7 — Unirse por enlace de invitación**

- **Endpoint:** `POST /api/playlists/join` (recibe enlace o código).
- **Respuesta:** `200` con la playlist y confirmación de que el usuario ahora es participante.
- **Códigos:** `200` unido (o ya era miembro, sin romper); `400` si falta o es inválido el código; `401` sin sesión; `404` si el código no corresponde a ninguna playlist.
- **Necesita:** B6; tabla de miembros con rol colaborador. Permisos se aplican en B8.
- **Criterios de aceptación:**
  - [x] Con enlace válido el usuario queda como miembro y aparece en participantes.
  - [x] Si ya era miembro, no se duplica.
  - [x] Enlace inválido o inexistente recibe error claro.

**B7: entregada en backend, con otra forma.** El plan pedía un único `POST /api/playlists/join` con el código en el
body; lo implementado son **dos rutas con el token en el path**: `GET /api/playlists/join/:token` (preview público:
`{ status, playlist: { id, name, description, creator }, isMember }`) y `POST /api/playlists/join/:token`
(`201` unido, `200` con mensaje "Ya eras participante", `404` "Invitación inválida"). Además hay un
`addCollaborator` que inserta `PlaylistMember` con `role: "colaborator"` y es idempotente. Resuelve **D10**.

### Frontend

**F5 — Generar y compartir el enlace**

- **Componente:** botón y mensaje "Invitar" en el detalle de la playlist colaborativa (componente pequeño nuevo).
- **Endpoint:** usa B6.
- **Casos:** botón solo visible/habilitado para el creador; deshabilitado mientras genera; confirmación visible de copia al portapapeles; error si falla; si el enlace ya existía, se reutiliza.
- **Criterios de aceptación:**
  - [ ] **Solo el creador ve/genera el link.**
  - [ ] El enlace queda copiado y funciona con F6.

**F5: pendiente.** `playlistsService.js` no expone `generateInviteLink` y `PlaylistDetail.jsx` no tiene el botón
"Invitar". Todo el backend para generarlo ya está (B6).

**F6 — Aceptar invitación y unirse**

- **Componente:** pantalla de aceptación (ruta nueva, **D10**) con resumen de la playlist y botón de unirse.
- **Endpoint:** usa B7.
- **Casos:** token inválido/inexistente con mensaje claro; sin sesión → login y retorno a la invitación; botón deshabilitado mientras procesa; si ya era miembro, mensaje de que ya forma parte; tras unirse, acceso al detalle.
- **Criterios de aceptación:**
  - [ ] **Usuario que entra por el link queda como participante (no creador), con permisos de TS-12.**
  - [ ] **Link inválido/expirado (mock: token no encontrado) muestra error claro, no rompe la app ni deja pantalla en blanco.**

**F6: pendiente, y es el eslabón roto de la feature.** No existe `joinPlaylistByInvite` en el service ni ruta en
`AppRoutes`. El backend ya genera enlaces, así que hoy un link compartido **cae en `*` → `/`**: ni siquiera muestra
el error que pide el segundo criterio. Antes de implementarla hay que cerrar el path, porque hoy conviven dos
distintos: el backend expone `/api/playlists/join/:token` (D10) pero arma el link como
`${FRONTEND_URL}/join/<token>` (`playlist.controller.js:220`), y `FRONTEND_URL` ni siquiera está en `.env.example`.
La ruta de la SPA tiene que coincidir con una de las dos.

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

**⚠️ Pendiente, pero el trabajo existe sin integrar.** En `dev` no hay nada de TS-14: ni `CreateRoom.jsx`, ni
`createRoom`/`joinRoom` en `roomsService`, ni rutas. La rama **`feat/ts14-crear-sala` (`77fe367`, sin mergear)** ya
tiene `features/rooms/CreateRoom.jsx`, `features/rooms/RoomView.jsx`, `createRoom`/`joinRoom`/`getRoomById` con
persistencia en `localStorage` (`synthos_mock_rooms`), las rutas `/salas/crear` y `/salas/:id`, y 46 líneas más en
`PENDIENTES.md`. Es anterior a PR #65 (orden por rating), así que **rebasa con conflicto probable** en
`Rooms.jsx`, `roomsService.js` y `RoomCard.jsx`: hay que decidir si se rescata esa rama o se rehace sobre `dev`.
Ojo: esa rama trae `RoomView.jsx` (el componente de TS-15) pero **sin** `kickMember` ni `controlPlayback`, así que
no avanza TS-15 ni TS-18.

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

**Sin cambios: sigue pendiente.** No hay `RoomView.jsx` en `dev` (solo existe en la rama `feat/ts14-crear-sala`), ni
`kickMember`/`controlPlayback` en `roomsService`, ni control de reproducción por sala. **D8 sigue abierta:** sin
backend con WebSockets, "lo que hace el anfitrión se refleja en todos" no es implementable de verdad.

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

**Sin cambios: sigue pendiente, y no es solo trabajo de frontend.** No existe `features/search/SearchRooms.jsx` ni
`searchRooms()` en `roomsService` (solo `listRooms({ sort })`), y `/salas` no tiene input de búsqueda. Del lado del
backend, `GET /api/rooms` **solo valida `sort`** (`validateSortType`): no acepta `query` ni devuelve el nombre del
anfitrión, así que el criterio "por nombre de usuario anfitrión" no se puede cumplir filtrando en el cliente.
**D7 sigue abierta.** Lo único reutilizable de TS-17 es el `?sort=` en la URL y el `RoomSortMenu`.

---

## TS-17 — Ordenar salas por calificación del anfitrión + conectar listado al backend (feature 16, 25%; ex F8)

**Contexto:** al buscar salas públicas, ordenar resultados por calificación del anfitrión (mejor calificado primero). Calificación visible en la tarjeta de sala. Hoy el frontend usa datos ficticios; el listado debe venir del backend real.
**Alcance:**

- Extiende TS-16: criterio de orden adicional "por calificación de anfitrión" junto a asc/desc por nombre.
- **F8:** conectar el servicio y la pantalla de listado a `GET /api/rooms` (sin ID de backend nuevo, el endpoint ya existe).

**Archivos:** extender `searchRooms()` en `roomsService.js` con parámetro de criterio de orden. Mostrar `hostRating` (de TS-11) en la tarjeta de sala.
**Falta (F8):** **Inconsistencia: la funcionalidad existe solo en frontend con datos ficticios.** Quitar el modo de prueba del servicio; mapear la respuesta real a la forma que usa la UI (**D7**); estado de carga y de error propios de llamada real; manejar salas sin calificación; verificar que el orden del servidor se respeta sin reordenar en el navegador.
**Criterios de aceptación:**

- [x] Nueva opción de orden "Mejor calificado" disponible junto a asc/desc.
- [x] Calificación del anfitrión visible en cada card de resultado (o "Sin calificar").
- [x] Ordenar por "Mejor calificado" funciona con datos del servidor.
- [ ] La vista ficticia ya no se usa.

**Dependencias:** TS-11 (Calificar anfitrión), TS-16 (Buscar salas). Criterio de "positiva": **D6**.

**3 de 4 hechos; el que falta (F8) es el más chico.** `Rooms.jsx` ya tiene el `RoomSortMenu` con el criterio en la URL
(`?sort=alphabetical|rating`) y `RoomCard` muestra `hostRating` con el caso "Sin calificar" (`hostRating === null`,
distinto de 0). El backend dejó de ser ficticio para el orden: la migración `20261013164336` reemplazó la vista
`room_avg_rating` por **`host_avg_rating`** (`AVG(host_rating.rating)` agrupado por anfitrión) y `room.service.js`
hace `LEFT JOIN` con `room_member` + `ORDER BY avg_rating DESC, room.name ASC`.
**Lo único que falta para cerrar F8 es apagar el flag:** `roomsService.USE_MOCK = true` sigue sirviendo
`mocks/rooms.js`, aunque `toRoom()` ya mapea los dos shapes y `Rooms.jsx` ya tiene estados de carga y de error de
llamada real. Ojo con **D6**: el promedio es de todas las calificaciones, no solo positivas (hoy solo hay seed).

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

**Sin cambios: sigue pendiente.** No hay `voteSkip` ni `getSkipVoteStatus`, no hay `RoomView.jsx` en `dev` y el
esquema **no tiene dónde guardar los votos** (`CONTEXT.md` §3 lo lista como hueco). Depende de TS-15 y de **D8**, que
sigue abierta.

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
  - [x] El dueño ve todas las recibidas en orden cronológico.
  - [x] Un usuario que recomendó hacia ese perfil ve solo la suya.
  - [x] Incluye los datos de la canción (sin llamadas extra).

**B1: entregada.** `GET /api/users/:id/recommendations` (`recommendation.service.js::getRecommendationsForProfile`)
filtra por `viewerId`: si sos el dueño, todas las recibidas (`playements.some.idUser = profileId`); si no,
solo las que vos enviaste (`idAuthor: viewerId`). Ordena `date: "desc"` y trae autor + canción en un solo
`include`, así que no hay llamadas extra. **D2 quedó resuelta como "No":** un tercero no es ni emisor ni receptor y
recibe `[]`.

**B2 — Crear una recomendación**

- **Endpoint:** `POST /api/recommendations`.
- **Respuesta:** `201` con la recomendación (texto, fecha, canción, emisor y receptor).
- **Códigos:** `201`; `400` si falta texto o canción, o texto vacío; `401` sin sesión; `403` si no hay seguimiento mutuo; `404` si receptor o canción no existen.
- **Necesita:** tablas de contenido, usuarios, seguimiento, canciones. Misma regla de destinatario que B1 (D1).
- **Regla:** solo con seguimiento mutuo. Si yo la sigo pero ella no me sigue, no puedo recomendarle.
- **Criterios de aceptación:**
  - [x] Se puede recomendar a alguien que me sigue y a quien sigo.
  - [x] Sin seguimiento mutuo se rechaza con mensaje claro.
  - [x] La recomendación aparece en el perfil del receptor (B1).

**B2: entregada.** `POST /api/users/:id/recommendations` valida texto y canción no vacíos (400), existencia de
usuario y canción (404) y `hasMutualFollow` (403) antes de insertar; responde **201** con la recomendación.
**D1 quedó resuelta:** el destinatario se guarda en `content_playement` (`create` de `content` + `contentPlayement`
en la misma transacción), sin campo nuevo.

### Frontend

**F1 — Recomendar desde el perfil de otra persona**

- **Componente:** formulario dentro del perfil público (nuevo, carpeta de perfil o recomendaciones); buscador de canciones reutilizando la lógica de búsqueda existente.
- **Endpoint:** usa B2.
- **Casos:** enviar deshabilitado mientras procesa y si falta canción o texto; mensajes de éxito/error (en especial "no hay seguimiento mutuo", explicando por qué); texto con longitud máxima; cancelar/limpiar; búsqueda de canciones con estado vacío y de carga.
- **Criterios de aceptación:**
  - [x] **Formulario oculto (o deshabilitado con explicación) si no hay follow mutuo** (usa TS-10).
  - [x] Con seguimiento mutuo se envía y se ve confirmación.
  - [x] Errores del servidor en lenguaje entendible.

**F1: entregada.** `ProfilePublic.jsx:185` renderiza la acción de recomendar solo cuando `follow.isMutual` (dato
que trae `useFollow.relationState`), así que el criterio de "oculto sin follow mutuo" se cumple por render, no por
un `disabled`. El formulario es `components/RecommendSongModal/RecommendSongModal.jsx` (texto con `maxLength`,
botón bloqueado mientras envía o si falta canción/texto) + `components/SongSearchStep/SongSearchStep.jsx` para elegir
la canción reutilizando la búsqueda existente (`hooks/useSongsSearch.jsx`). Los errores pasan por
`utils/mapError.js`.

**F2 — Ver recomendaciones en el perfil**

- **Componente:** sección de recomendaciones del perfil (propio y público), reutilizando avatar y tarjeta de canción.
- **Endpoint:** usa B1.
- **Casos:** carga (esqueleto/spinner); lista vacía con mensaje amigable; error de red con reintento; datos del perfil y de la lista no se pisan; móvil y desktop.
- **Criterios de aceptación:**
  - [x] **Orden cronológico consistente, más reciente primero.**
  - [x] **Visibilidad respetada:** dueño ve todo, emisor ve solo lo suyo en perfil ajeno.
  - [x] Canciones con título, artista y carátula sin llamadas extra.

**F2: entregada.** `components/RecommendationSection/RecommendationSection.jsx` cubre esqueleto de carga, error con
reintento y lista vacía con mensaje; el orden se refuerza en el cliente (`useRecommendation.jsx` ordena por fecha
desc) además del `orderBy` del backend. Está montado en `ProfileView.jsx` (propio) y `ProfilePublic.jsx` (ajeno), cada
uno con su `RecommendationProvider` para no pisarse entre sí.

**Dependencias:** TS-10 (Seguir personas).

**Estado: entregada completa (B1 + B2 + F1 + F2), con D1 y D2 resueltas.**

- **Desviaciones de contrato:** el plan pedía `POST /api/recommendations` (sin id en la ruta) y quedó como
  `POST /api/users/:id/recommendations`, que es lo que consume el frontend.
- **Endpoint extra:** existe `GET /api/users/:id/follow-status` → `{ viewerFollows, targetFollows, isMutual }`,
  que el plan no pedía. **Hoy ningún componente lo consume**: la pantalla resuelve el follow mutuo en el cliente con
  `useFollow.relationState` (dos llamadas). Queda como endpoint disponible, no como pieza en uso.
- **Nombre del service:** `services/recommendationService.js` (en singular), no `recommendationsService.js` como decía
  el plan; y el estado no vive en el service sino en `context/recommendationContext.jsx` + `hooks/useRecommendation.jsx`,
  siguiendo el patrón de las demás features (hook + contexto propio en vez de un Context global nuevo).

---

## TS-20 — Recomendaciones por estado de ánimo con IA (feature 14, 50%)

**Contexto:** el usuario pide recomendaciones de música según su estado de ánimo, detectado por escaneo facial con IA (alegría, tristeza, calma, etc.).

**⚠️ Bloqueada por D4** (quién detecta la emoción). Sin esa decisión no se pueden fijar criterios finales de detección. **El endpoint de canciones por ánimo ya no depende de ella: está implementado (B9).**

### Backend

**B9 — Canciones por estado de ánimo**

- **Endpoint:** `GET /api/songs/mood` (recibe el estado detectado).
- **Respuesta:** lista de canciones con título, artista, carátula y datos de reproducción, formato similar a otras listas de canciones.
- **Códigos:** `200` (aunque vacía); `400` si el estado no es válido; `500` error del servidor.
- **Necesita:** tabla de estados de ánimo y su relación con canciones (ya existen en el esquema y seed). No depende de otras tareas.
- **Nota:** el endpoint solo recibe el resultado de la detección y devuelve música.
- **Criterios de aceptación:**
  - [x] Cada estado válido devuelve canciones del catálogo.
  - [x] Estado inválido recibe error claro.
  - [x] Respuesta con datos suficientes para reproducir y mostrar.

**B9: entregada, con otra ruta y otro parámetro.** Se implementó como
`GET /api/songs/recommendations?expression=<ánimo>` (`song.service.js::getRecommendationsByExpression`): valida el
ánimo contra la lista de estados válidos (400 "Expresión inválida" si no), trae canciones aleatorias del catálogo de
ese ánimo con `SONG_INCLUDE` (datos de reproducción incluidos) y devuelve `200 { status, songs }` — o `[]` si no hay.
El plan pedía `/api/songs/mood`; se documenta la ruta real como canónica.

### Frontend

**F9 — Pantalla de escaneo y recomendaciones**

- **Componente:** nueva feature con ruta nueva accesible desde menú o inicio.
- **Qué hace:** activa la cámara, detecta el ánimo y muestra canciones recomendadas, reproducibles al instante.
- **Endpoint:** usa B9 para canciones; la detección depende de D4.
- **Casos:** permiso de cámara denegado con explicación y salida limpia; cámara no disponible (desktop sin webcam); ningún estado detectado con mensaje de reintento; carga durante detección y búsqueda; lista vacía para algún ánimo; volver a escanear; reproducir usa el reproductor global.
- **Criterios de aceptación:**
- [x] Flujo completo de punta a punta (cámara → ánimo → canciones → reproducir).
- [x] Si se decide otro modo de detección (D4), la pantalla se adapta sin cambiar el resto de la experiencia.
- [x] Permisos y errores de cámara se manejan sin dejar la app rota.

**Dependencias:** ninguna técnica dura, bloqueada por D4.

**F9: entregada (con D4 resuelta).** `features/mood/`: `MoodScan.jsx` (pantalla), `moodDetection.js`
(detector), `MoodPicker.jsx` (selector manual) y `MoodResults.jsx` (lista); ruta `/animo` y entrada
"Ánimo" en el Sidebar con `microphone.svg`.

- **Carga bajo demanda:** face-api.js 0.22.2 (664 KB) se inyecta como `<script>` la primera vez que se
  entra a la pantalla, y los pesos (`tinyFaceDetector` + `faceExpressionNet`, ~500 KB) con
  `loadFromUri` desde el mismo tag de versión. No es dependencia npm y no pesa en el bundle inicial.
- **Modelo `tiny`:** solo detección + expresiones, sin landmarks. Las 7 expresiones se reducen a los 3
  estados del catálogo (`moodFromExpressions`, función pura con umbral de confianza 0,55 y `neutral`
  por defecto).
- **Nunca se rompe:** sin cámara, permiso denegado, sin rostro, o CDN caído → el selector manual, que
  es el mismo camino que usa la detección. La cámara se detiene siempre en el cleanup.
- **Privacidad:** el frame no sale del dispositivo; es lo que dice la pantalla.
- **Verificación:** smoke en Chrome con `--use-fake-device-for-media-stream`: la cámara arranca
  (640×480), el detector carga script + pesos, el análisis responde "No detectamos un rostro" (la
  cámara falsa no muestra ninguno), el selector manual trae `GET /songs/recommendations?expression=happy`
  y pinta 20 `MediaCard`, y el play usa el reproductor global. El mapeo de expresiones se probó aparte
  (11 casos). **Lo que no se pudo verificar automáticamente es la detección sobre un rostro real.**

---

## TS-21 — Subir foto de perfil desde dispositivo o cámara (ex B3 + F3)

**Contexto:** el usuario elige una imagen de su dispositivo o toma una foto, la previsualiza y la guarda como foto de perfil. Sin foto elegida se mantiene el avatar por defecto.
**D3 resuelta:** servicio en nube **ImageKit** (Vercel no tiene disco). Contrato completo en `ESPECIFICACIONES-BACKEND.md` §7.1.

**Backend (B3)**

- **Endpoint:** `POST /api/users/me/picture` (recibe archivo de imagen).
- **Respuesta:** `200` con la URL pública de la imagen guardada.
- **Códigos:** `200`; `400` si no viene archivo, formato no permitido o supera el tamaño máximo; `401` sin sesión; `500` si falla el guardado.
- **Necesita:** solución de almacenamiento (D3). El endpoint existente de editar perfil ya acepta una URL de foto: esta tarea solo agrega la subida.
- **Criterios de aceptación:**
  - [x] Imagen válida se sube y la URL devuelta muestra la foto en el navegador.
  - [x] Archivos que no son imagen o exceden el máximo se rechazan con mensaje claro.

**Frontend (F3)**

- **Componente:** formulario de edición de perfil (ya existe; ajustar). **Revisar: ya existe parcialmente**: hoy la foto se lee como texto enorme y se manda dentro del JSON de edición; puede fallar y no persiste como archivo real.
- **Endpoint:** usa B3.
- **Falta:** enviar el archivo al endpoint; validar tipo y tamaño antes de enviar; progreso; errores claros; no permitir guardar si la subida falló; habilitar cámara donde el dispositivo lo soporte.
- **Criterios de aceptación:**
  - [x] La foto se sube como archivo y aparece en el perfil y en el resto de la app (ej. junto al nombre en la barra lateral).
  - [x] Imagen demasiado grande o formato no permitido: mensaje claro.
  - [x] Sin foto: avatar por defecto.
  - [x] Guardar sin tocar la foto no rompe nada.

**Dependencias:** TS-05 (perfil).

**Estado: entregada (B3 + F3), con D3 resuelta.**

- **D3 → ImageKit.** El cliente se instancia **perezoso**: el SDK tira al construirse sin `IMAGEKIT_PRIVATE_KEY` y, como el módulo se importa en cascada desde `app.js`, armarlo al cargar tumbaba todo el arranque. Ahora sin la var el server levanta igual y el endpoint responde 500 en español.
- **Contrato B3 respetado:** la foto entra por `POST /api/users/me/picture` en multipart (campo `picture`, `multer` con memoria y `fileFilter`), tope de **2 MB**, JPG/PNG/WEBP. `PATCH /users/me` **rechaza con 400** las data URLs: `pictureUrl` es una columna de texto, no un almacén (era la deuda de `PENDIENTES.md` §7).
- **Recorte y compresión en el cliente** (`features/profile/profileImage.js`): la foto entra por `<input type="file">`, no por la red; se recorta a 1024 px de lado mayor y se comprime a ≤1 MB en pasos de escala. Es lo que hace viable la subida: el body de una serverless function de Vercel corta ~4,5 MB. Por eso `express.json()` volvió a su límite por defecto (antes se había globalizado a 10 MB).
- **Cero huérfanos sin borrar nada:** el upload va con `useUniqueFileName: false` y nombre determinista (`avatars/avatar-<id>.<ext>`), así que ImageKit reemplaza el archivo del usuario en sitio. Se evaluó borrar el anterior y se descartó: la API de ImageKit no resuelve un `fileId` desde la URL (`path`, `fileName` y `search` de `GET /v1/files` solo matchean carpetas) y el listado por carpeta va con delay, así que "buscar y borrar" no es confiable. Known: cambiar de formato (JPG → PNG) deja el archivo viejo.
- **Cache busting:** como el nombre no cambia, la URL guardada suma `?v=<timestamp>`; sin eso el avatar nuevo no se veía (verificado en navegador: la imagen servida era la anterior).
- **F3:** previsualización con object URL (se revoca al reemplazar/desmontar), estado de submit propio (el `loading` de `useAuth` es el de la sesión y no bloqueaba nada, con lo que un doble click mandaba dos PATCH), botón "Tomar foto" con `capture="user"` oculto en desktop, "Quitar foto" que manda `pictureUrl: null` solo al guardar, y el `finally` que rehabilita el botón si falla el guardado.
- **Verificación:** backend con `curl` contra la base real y contra ImageKit (200 con la URL, 400 sin archivo / tipo no permitido / 3 MB, 401 sin token, 400 con data URL en el PATCH, avatar servido con `?v=`, y **el contador de archivos en `/avatars` no crece al resubir**); frontend con `npm run lint` y `npm run build` limpios y un smoke en Chrome real (CDP): 5,9 MB → 757 KB en el navegador, `POST /api/users/me/picture` + `PATCH /api/users/me`, avatar cargado (717×478) en perfil y sidebar.
- **Desviación menor:** "progreso" es estado textual ("Recortando…", "Subiendo…", "Guardando…") más el botón bloqueado, no un porcentaje: `api.js` va con `fetch` y no hay `onprogress`; con ≤1 MB la subida dura lo que cualquier request.

---

## Orden de ejecución sugerido para el agente

Estado al 2026-10-14, sobre `dev`: **entregadas** TS-10, TS-10b, TS-19 (completa), TS-20 (completa), TS-21, y la
parte de backend de TS-12 (B5) y TS-13 (B6/B7). Con **D1, D2, D3, D4, D9, D10, D11 y D12 resueltas**.

1. **TS-19**, **TS-20**, **TS-21**, **TS-10 / TS-10b**: entregadas.
2. **TS-12** → queda F4 + F7 de frontend y el resto de B8. B5 ya está. Ojo: la lógica de roles de B8
   (`addSong`/`removeSong`) **ya está escrita en `playlist.controller.js` pero sin rutas** en
   `playlist.routes.js`: montar esas dos rutas es la parte chica de B8.
3. **TS-13** → quedan F5 + F6. B6/B7 ya están; **arrancar por cerrar el path del link** (hoy el backend expone
   `/api/playlists/join/:token` pero arma `${FRONTEND_URL}/join/:token`, y esa ruta no existe en `AppRoutes`), y de
   paso agregar `FRONTEND_URL` a `.env.example`.
4. **TS-14** → decidir si se rescata `feat/ts14-crear-sala` (rebasa con conflicto en `Rooms.jsx`/`roomsService.js`)
   o se rehace sobre `dev`. Es el bloque que habilita TS-11, TS-15 y TS-18.
5. **TS-16** → necesita backend: `GET /api/rooms` no acepta `query` ni trae el nombre del anfitrión (**D7**).
6. **TS-17** → queda solo F8: apagar `roomsService.USE_MOCK`. Es lo más chico de toda la lista y el backend ya está.
7. **TS-11** → detrás de **D5** (alta de `POST /api/rooms/:id/rating`) y **D6** (qué es "positiva").
8. **TS-15** → **TS-18**, solo tras resolver **D8** (sincronización); sin eso, "se refleja en todos" no es real.

> Nota: B8 requiere B7 (necesita roles de colaborador reales) y ambos ya existen, así que B8 se puede atacar ahora
> mismo sin esperar a nada. El orden original (backend antes que frontend dentro de una feature) sigue valiendo.

> Nota: B8 requiere B7 (necesita roles de colaborador reales). Si el agente prefiere, B5, B6, B7 y B8 pueden implementarse seguidos en backend y luego F4–F7 en frontend.
