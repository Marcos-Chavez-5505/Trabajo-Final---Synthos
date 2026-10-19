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

| #   | Decisión                                                                                                                                                                                                                                                     | Opciones                                                                                                                                                                                                                                                                                                                                       | Bloquea                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| D1  | **Destinatario de una recomendación.** El modelo de contenido guarda autor, texto, canción y fecha, pero no destinatario.                                                                                                                             | **resuelta:** en `content_playement` (`recommendation.service.js`). Sin campo nuevo.                                                                                                                                                                                                                                                 | TS-19 (B1, B2)                               |
| D2  | **Visitante externo** (ni emisor ni receptor): ¿ve las recomendaciones en el perfil público?                                                                                                                                                          | **resuelta: No.** `getRecommendationsForProfile` filtra por `idAuthor: viewerId` cuando el visor no es el dueño, así que un tercero recibe `[]`. Dueño ve todas las recibidas, emisor solo las suyas.                                                                                                                           | TS-19 (B1, F2)                               |
| D3  | **Almacenamiento de fotos de perfil.** No hay infraestructura de subida. El despliegue es en Vercel, **el disco local no persiste**: favorece servicio externo.                                                                                   | **resuelta (2026-10-13):** servicio en nube **ImageKit** + endpoint dedicado `POST /api/users/me/picture` (multipart) + recorte/recompresión en el cliente. Ver TS-21.                                                                                                                                                          | TS-21 (B3)                                   |
| D4  | **Detección de estado de ánimo** (escaneo facial con IA). No hay código ni dependencias de IA.                                                                                                                                                       | **resuelta (2026-10-14): detección en el navegador** con face-api.js 0.22.2 desde CDN, cargado bajo demanda, modelo `tiny` (`tinyFaceDetector` + `faceExpressionNet`), y las 7 expresiones reducidas a los 3 estados del catálogo. Sin dependencia npm y sin backend; si el CDN no responde, la pantalla cae al selector manual. | TS-20 (F9)                                   |
| D5  | **Crear calificaciones de anfitrión.** Existe la tabla y la vista de promedio, pero **no hay endpoint para crear**; los datos vienen del seed.                                                                                                   | Agregar tarea backend (propuesta B10 en TS-11) / dejar solo seed.                                                                                                                                                                                                                                                                              | TS-11 en producción                         |
| D6  | **"Calificaciones positivas".** El alcance dice positivas, la vista actual promedia todas.                                                                                                                                                              | Promedio de todas / solo positivas (ej. 4 a 5).                                                                                                                                                                                                                                                                                                | TS-11, TS-17                                 |
| D7  | **Respuesta real de `GET /api/rooms`.** El modelo de sala no tiene campo de anfitrión (se infiere por rol en la sala). Verificar que incluya nombre y calificación del anfitrión.                                                                  | **Definida (2026-10-16), pendiente de implementar:** se modifica el endpoint (ver **B21**) para filtrar por texto, devolver anfitrión (id y username), `avg_rating`, cantidad de miembros y capacidad, y aceptar `sort=name\|rating` y `order=asc\|desc`.                                                                     | TS-16, TS-17 (F8)                            |
| D8  | **Sincronización de sala.** Sin backend con WebSockets, "sincronizado" no es real.                                                                                                                                                                     | **Resuelta (2026-10-16): WebSocket con Socket.IO**, como sugiere `AGENTS.md` (opción (a)/(b)/(c) descartadas). Ver **B11**. Alcance asumido: una sola instancia del servidor; el estado de reproducción vive en memoria y se pierde si el servidor se reinicia (aceptable para el alcance).                                    | TS-15, TS-18 (ahora solo bloqueadas por B11) |
| D9  | **Permisos del creador de playlist.** Editar nombre/descripción, borrar la playlist, invitar y echar son del creador. **Las canciones no**: en una colaborativa cualquier participante agrega y quita.                                           | **resuelta:** `PUT /:id` y `DELETE /:id` dan 403 a todo lo que no sea `idCreator`; `POST/DELETE /:id/songs` piden ser miembro. Invitar y echar, también solo del creador.                                                                                                                                                       | TS-12                                        |
| D10 | **Ruta de invitación.** `/playlists/join/:token` vs `/playlists/invitar/:token`.                                                                                                                                                                   | **obsoleta:** la invitación dejó de ser un link (ver "Decisión del usuario sobre TS-13", más abajo). No hay ruta de invitación en el frontend: la invitación se elige a una persona y se acepta desde la sub-pestaña de `/playlists`.                                                                                                                | TS-13                                        |
| D11 | **Invitación repetida a la misma persona.** Si el creador vuelve a invitar a alguien que ya fue invitado o que ya participates.                                                                                                                        | **resuelta: se reenvía.** La fila de `playlist_invitation` es única por (`playlist`, `receiver`), así que invitar de nuevo la deja en `pendiente` otra vez; si la persona ya es miembro, `409 PLAYLIST_ALREADY_MEMBER`.                                                                                                     | TS-13                                        |
| D12 | **Estado real de TS-10 en la búsqueda.** El plan mock dice que `UserRow` (con botón seguir) se usa en `SearchPeople`; F10 dice que la búsqueda no muestra estado de seguimiento. Probable causa: lo primero es mock, lo segundo es backend real. | **resuelta (verificado contra el código):** `UserRow` es un `<Link>` plano sin botón (también en `FollowList`); `SearchPeople` no muestra el estado. El plan-mock no se cumple → TS-10b es trabajo real.                                                                                                                     | TS-10b                                       |
| D14 | **Salas privadas en la búsqueda.**                                                                                                                                                                                                                     | **Resuelta (2026-10-16):** las salas privadas no aparecen en la búsqueda; se entra a ellas con el **código** de la sala (`POST /api/rooms/join`) y su contraseña.                                                                                                                                                             | TS-14, TS-16                                 |
| D15 | **Cerrar una sala.** El enunciado no menciona cómo termina una sala.                                                                                                                                                                                   | **Decisión pendiente (PM):** se agrega `DELETE /api/rooms/:id` (solo anfitrión) porque sin eso las salas nunca terminan. Marca la sala como cerrada y emite `room:closed`.                                                                                                                                                         | TS-15 (B19)                                  |
| D16 | **¿Puede el anfitrión salir de su sala?**                                                                                                                                                                                                             | **Decisión pendiente (PM):** se asume que sí y que eso **cierra la sala** (misma lógica que D15).                                                                                                                                                                                                                               | TS-14 (B14)                                  |
| D17 | **"Mayoría de los votos por miembro en sala"** (votar para saltar).                                                                                                                                                                                    | **Decisión pendiente (PM):** se interpreta como mayoría sobre los miembros que **no** son anfitrión (más de la mitad; ej. 3 miembros requieren 2 votos).                                                                                                                                                                       | TS-18 (B20)                                  |
| D18 | **Fin de la playlist de una sala.** Qué pasa con `next` en la última canción.                                                                                                                                                                      | **A confirmar:** se asume que vuelve a la primera.                                                                                                                                                                                                                                                                                       | TS-15 (B17)                                  |

**Decisión ya tomada:** orden cronológico de recomendaciones = **más reciente primero** (definido en B1; reemplaza el "definir y ser consistente" del plan mock).

### Decisión del usuario sobre TS-13 (2026-10-15)

La invitación **no es un link**: es dirigida a una persona que ya existe en el sistema, con estado pendiente y
Aceptar/Rechazar, y vive **dentro de la app**, en una sub-pestaña de `/playlists`. En una colaborativa
**cualquier participante puede agregar y quitar canciones**; el creador conserva editar, borrar, invitar y echar.
Además, **invitar convierte la playlist en colaborativa**: no existe el "miembro de una playlist personal".
Esto reemplaza D10 y D11, y es lo que implementan B6/B7 y F5/F6.

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

**Nota (2026-10-16):** esta feature figura en el 50% y **no forma parte de las entregas del 75%** (Crear salas, Administrar sala, Votar para saltar, Buscar salas). Sigue sin tareas de backend/frontend desglosadas más allá de la propuesta B10; si se decide avanzar, hay que armarlas (depende de **D5** y **D6**) y reutilizar el canal de sala de **B11** si se quiere refrescar la calificación en vivo.

---

## TS-12 — Crear playlist colaborativa (feature 19, 50%)

**Contexto:** el usuario crea una playlist marcada como colaborativa. Él es el creador original.
**Alcance:**

- Crear playlist colaborativa (extensión de playlist normal, TS-09): es la misma playlist con `type: "colab"` y una fila en `playlist_member` por participante, con rol `creator` o `colaborator`.
- Participantes agregan canciones.
- **Cualquier participante agrega y quita canciones.** Lo que queda reservado al creador es editar nombre/descripción, borrar la playlist, invitar y echar (**D9**).

**Archivos (frontend):** no hacen falta funciones nuevas en `src/services/playlistsService.js`: la creación colaborativa es `createPlaylist(ownerId, { name, description, type })` con `type: 'colab'` (no existe `createCollaborativePlaylist`), y las canciones ya usan `addSongToPlaylist(ownerId, playlistId, songId)` / `removeSongFromPlaylist(ownerId, playlistId, songId)` de TS-09, que pegan a `POST|DELETE /playlists/:id/songs` y **no** validan el dueño: en una `colab` cualquier miembro puede agregar y quitar.

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
`personal`; el `creator` viene en `PLAYLIST_INCLUDE`, así que la respuesta 201 ya identifica el tipo y el creador. El
controller **valida el tipo**: sin `type`, o con uno que no sea `personal` o `colab`, responde `400 PLAYLIST_TYPE_INVALID`.
Al crear una `colab` se inserta además la fila `playlist_member` con rol `creator`.

**B8 — Aplicar permisos de playlist colaborativa**

- **Endpoint:** `POST /api/playlists/:id/songs`, `DELETE /api/playlists/:id/songs/:songId`, `PUT /:id` y `DELETE /:id`.
- **Respuesta:** misma estructura que hoy.
- **Códigos:** los actuales + `403 NOT_PLAYLIST_OWNER` / `403 NOT_PLAYLIST_MEMBER`.
- **Necesita:** B5, B7; tabla de miembros con roles.
- **Criterios de aceptación:**
  - [x] Un participante agrega canciones sin problema.
  - [x] El creador puede todo.
  - [x] Un usuario sin relación con la playlist recibe error al intentar editarla.

**B8: entregada en backend.** `POST /:id/songs` y `DELETE /:id/songs/:songId` están montadas y aplican los roles: en una
`personal` solo el dueño, en una `colab` cualquier miembro (agregar y quitar). `PUT /:id` y `DELETE /:id` siguen siendo
del creador (**D9**) y ya no se usan para tocar canciones: el frontend va por las rutas de canciones.

### Frontend

**F4 — Crear playlist colaborativa** (formulario de creación, ya existe; ajustar)

- **Endpoint:** usa B5.
- **Falta:** opción clara "colaborativa" con explicación breve de qué implica; validaciones iguales a las actuales (nombre obligatorio, etc.); botón deshabilitado mientras se crea; manejo de error del servidor.
- **Criterios de aceptación:**
  - [x] Puedo crear una playlist colaborativa y aparece en mi lista identificada como tal.
  - [x] Las playlists normales se crean igual que antes.

**F4: entregada.** `PlaylistCreateForm.jsx` tiene el selector "Solo vos / Colaborativa" con la explicación de qué implica,
y `playlistsService.createPlaylist` manda `type` (antes no lo mandaba y toda creación devolvía `400 PLAYLIST_TYPE_INVALID`).
`PlaylistTile` marca las colaborativas.

**F7 — Ajustar el detalle de la playlist a la colaboración** (detalle y fila de canción, ya existen; ajustar)

- **Endpoint:** usa B8 (y los endpoints existentes de consulta).
- **Falta:** ocultar/deshabilitar borrado y edición para quienes no son el creador; mostrar marca de colaborativa y rol del usuario actual; mensajes cuando el servidor rechaza (403); lista de participantes si el detalle la trae.
- **Criterios de aceptación:**
  - [x] La UI oculta editar, eliminar y echar para quien no es el creador original.
  - [x] Participante puede agregar y quitar canciones.
  - [x] El creador ve todas las acciones.
  - [x] Un usuario sin relación no ve acciones de edición.
  - [x] Si el servidor rechaza algo, el usuario entiende por qué.

**F7: entregada.** `toPlaylist` expone `type`, `role`, `creator` y `members`, así que el detalle sabe si es colaborativa y
qué rol tiene quien mira. Editar/Eliminar/Invitar/Echar son solo del creador; "Quitar" de una canción queda para los
participantes. Los 403 se muestran con `mapApiError`, y `GET /playlists/:id` ahora exige sesión y responde `404` si no
sos creador, ni miembro, ni la playlist es pública.

**Dependencias:** TS-09 (Playlists personales, Sprint 1).

---

## TS-13 — Invitar usuarios a playlist colaborativa (feature 20, 100%)

**Contexto (redefinido el 2026-10-15):** el creador de una playlist colaborativa invita **a una persona concreta que ya
existe en la app**. No hay link ni pantalla fuera de la aplicación: la invitación queda pendiente y el destinatario la
acepta o la rechaza desde una sub-pestaña de `/playlists`. Al aceptarla queda como participante (agrega y quita
canciones); el creador conserva editar, borrar, invitar y echar.

**Alcance:**

- Invitar a una persona existente (solo el creador).
- Bandeja de invitaciones recibidas con Aceptar/Rechazar.

**Archivos (frontend):** `src/services/playlistsService.js` → `sendInvitation`, `listSentInvitations`,
`listReceivedInvitations`, `acceptPlaylistInvitation`, `rejectPlaylistInvitation`, `removePlaylistMember`.
`features/playlists/InviteUserDialog.jsx` y `PlaylistInvitations.jsx`. **Sin ruta nueva en `AppRoutes.jsx`.**

### Backend

**B6 — Invitar a una persona**

- **Endpoint:** `POST /api/playlists/:id/invitation`, body `{ userId }`.
- **Respuesta:** `201 { status, invitation }`.
- **Códigos:** `401` sin sesión; `403 NOT_PLAYLIST_CREATOR` si no es el creador; `404 PLAYLIST_NOT_FOUND`;
  `400 INVITATION_FAVORITES_LOCKED` si es la de favoritos; `400 INVITATION_SELF`; `404 INVITATION_USER_NOT_FOUND` si esa persona no existe;
  `409 PLAYLIST_ALREADY_MEMBER`; reenviar a alguien ya invitado la deja `pendiente` otra vez (**D11**).
- **Necesita:** tabla de invitaciones pendientes.
- **Criterios de aceptación:**
  - [x] Solo el creador puede invitar; un participante recibe 403.
  - [x] Solo se puede invitar a alguien que existe en el sistema.

**B6: entregada en backend.** Nuevo modelo `PlaylistInvitation` (migración `20261015203304_playlist_invitation`) con
clave primaria compuesta (`idPlaylist`, `idReceiver`) y estado `pendiente | aceptada | rechazada`, más
`GET /:id/invitations` para que el creador vea a quién invitó y en qué estado.

**Invitar convierte la playlist en colaborativa (decisión del usuario, 2026-10-15).** No hay un concepto de "miembro
de una playlist personal": al invitar, `POST /:id/invitation` cambia el `type` a `colab` e inserta la fila
`playlist_member` del creador, en la misma transacción que la invitación. La respuesta trae `converted: true` para que el
frontend recargue. La única excepción es la playlist de favoritos, que no se puede invitar ni convertir. Sin migración:
es un `UPDATE` sobre un enum que ya tenía `colab`.

**B7 — Aceptar o rechazar la invitación**

- **Endpoints:** `GET /api/playlists/invitations` (pendientes recibidas), `POST /api/playlists/invitations/:idPlaylist/accept`,
  `POST /api/playlists/invitations/:idPlaylist/reject`.
- **Respuesta:** `201` al aceptar, `200` al rechazar, con la invitación actualizada.
- **Códigos:** `401` sin sesión; `404 INVITATION_NOT_FOUND` si no hay una invitación pendiente para esa playlist.
- **Necesita:** B6. Permisos en B8.
- **Criterios de aceptación:**
  - [x] Quien acepta queda como miembro y aparece en participantes.
  - [x] Si ya era miembro, no se duplica.
  - [x] Sin invitación pendiente, el error es claro.

**B7: entregada en backend.** Aceptar es una transacción: inserta el `PlaylistMember` con rol `colaborator` y marca la
invitación como `aceptada` (o nada). También se agregó `DELETE /api/playlists/:id/members/:userId` para que el creador
eche a un participante (solo del creador, con `400 CANNOT_REMOVE_CREATOR` si se intenta echar a uno mismo).

**Lo que se borró:** el flujo por token (`generateInvitation`, `previewInvitation`, `joinPlaylist`,
`generateInvitationToken`, `getPlaylistByToken`, `addCollaborator`) y con él `FRONTEND_URL`. La columna
`playlist.token_invitation` se borró después en la migración `drop_token_invitation`.

### Frontend

**F5 — Invitar desde el detalle**

- **Componente:** botón "Invitar" en el detalle de una colaborativa (solo del creador) que abre `InviteUserDialog`.
- **Casos:** buscador de personas con debounce, se esconden quienes ya participan o ya tienen invitación abierta,
  feedback de envío y error con `mapApiError`, lista de invitados con su estado (Pendiente / Aceptó / Rechazó).
- **Criterios de aceptación:**
  - [x] Solo el creador ve el botón y puede invitar.
  - [x] La invitación queda registrada y el invitado la ve.

**F5: entregada.** El botón "Invitar" está en toda playlist propia que no sea favoritos (en una personal, el diálogo
avisa que al invitar deja de ser privada) y abre `InviteUserDialog`.

**F6 — Bandeja de invitaciones**

- **Componente:** tercera sub-pestaña de `/playlists` (`?tab=invitaciones`) con la lista de pendientes y Aceptar/Rechazar.
- **Casos:** Aceptar lleva al detalle de la playlist y la playlist pasa a la sub-pestaña "Colaborativas" y al grupo del
  Sidebar; sin invitaciones, estado vacío.
- **Criterios de aceptación:**
  - [x] Quien acepta queda como participante, no creador, con los permisos de TS-12.
  - [x] Sin invitaciones no se rompe la pantalla.

**F6: entregada.** La lista se refresca sola porque `acceptPlaylistInvitation` y `rejectPlaylistInvitation` notifican
por `subscribeToPlaylists`.

**Dependencias:** TS-12.

---

## TS-14 — Crear sala de escucha compartida (feature 10, 75%)

**Contexto:** el usuario crea una sala para reproducir música sincronizada a partir de una **playlist personal propia ya existente**: debe ser de tipo personal (no favoritos ni colaborativa) y tener al menos una canción. **Si no tiene ninguna playlist personal, no puede crear sala.** Además de crear, esta tarea cubre entrar a una sala (con su código), salir de ella y ver su detalle.
**Alcance:**

- Form: nombre, descripción (opcional), pública o privada (con contraseña si privada).
- Selección obligatoria de una playlist personal propia, con canciones, como fuente.
- Máximo 10 miembros por sala (valor **fijo**, lo guarda el servidor; el cliente no lo manda).
- Creador = único anfitrión y administrador (queda en `room_member` con rol `host`).
- Entrar con código de sala (y contraseña si es privada), salir de la sala y ver el detalle de la sala (**D14**: las privadas no salen en la búsqueda).

**Archivos:** `src/services/roomsService.js` → `createRoom(data)`, `joinRoom(code, password?)` (**cambia respecto de la firma anterior `joinRoom(roomId, password?)`: el contrato real entra por código**), `leaveRoom(roomId)`, `getRoomById(roomId)`. `src/features/rooms/CreateRoom.jsx`, `RoomView.jsx`, modal "Unirme con código". `src/mocks/rooms.js`.
**Backend:** definido en B12–B15 (abajo). Ya no es solo capa mock.
**Criterios de aceptación:**

- [ ] Bloquea creación si el usuario no tiene ninguna playlist personal con canciones (mensaje claro, no error genérico).
- [ ] Sala privada exige contraseña para unirse; pública no.
- [ ] Al llegar a 10 miembros, nuevos intentos de unirse se rechazan con mensaje claro ("Sala llena 10/10").
- [ ] Colores/tipografía con clases de `index.css`.

### Backend

**B12 — Crear sala**

- **Endpoint:** `POST /api/rooms`.
- **Body:** `{ "name": string, "description": string (opcional), "playlistId": number, "isPrivate": boolean, "password": string (obligatoria si es privada) }`.
- **Respuesta:** la sala creada (id, código, nombre, descripción, si es privada, capacidad, anfitrión y playlist fuente), **sin la contraseña**.
- **Códigos:** `201` si se creó; `400` si falta el nombre o la playlist, si es privada sin contraseña o si la playlist no tiene canciones; `401` sin sesión; `403` si la playlist no es del usuario; `404` si la playlist no existe.
- **Necesita:** middleware de autenticación. Validar que la playlist pertenezca al usuario, sea de tipo personal (no `favorites` ni `colab`) y tenga al menos una canción; si el usuario no tiene ninguna playlist personal, no puede crear la sala. Guardar `maxCapacity` en 10 (fijo) y `status` en activa. Generar un `code` único (ej. 6 caracteres alfanuméricos en mayúsculas, reintentando si ya existe). Si es privada, guardar la contraseña hasheada (bcrypt) en `passwordHash`. En una transacción: crear la sala y agregar al creador en `room_member` con rol `host`.
- **Explicación:** crea la sala; el creador queda como único anfitrión y administrador.
- **Criterios de aceptación:**
  - [ ] Crear con playlist propia, personal y con canciones devuelve 201 sin `passwordHash`.
  - [ ] Playlist ajena (403), inexistente (404), vacía o privada sin contraseña (400) se rechazan.
  - [ ] Sala y fila de anfitrión se crean en una sola transacción.

**B13 — Unirse a una sala con código**

- **Endpoint:** `POST /api/rooms/join`.
- **Body:** `{ "code": string, "password": string (solo para salas privadas) }`.
- **Respuesta:** los datos de la sala a la que se unió.
- **Códigos:** `201` si se unió; `200` si ya era miembro; `400` si la sala está cerrada; `401` sin sesión; `403` si la sala es privada y la contraseña falta o es incorrecta; `404` si no existe una sala con ese código; `409` si la sala ya tiene 10 miembros.
- **Necesita:** middleware de autenticación. Buscar la sala por `code`, comparar la contraseña con `passwordHash` (bcrypt), validar el cupo contando `room_member` **dentro de una transacción** (para que dos personas no entren a la vez pasando el límite) e insertar al usuario con rol `member`. Emitir `room:members` (B11).
- **Explicación:** permite entrar a salas públicas (sin contraseña) y privadas (con contraseña) respetando la capacidad máxima. Se usa el código porque las salas privadas no aparecen en la búsqueda.
- **Criterios de aceptación:**
  - [ ] Dos ingresos simultáneos con un cupo libre no superan los 10 miembros.
  - [ ] Si ya era miembro responde 200 y no se duplica la fila.
  - [ ] Contraseña faltante o incorrecta en sala privada devuelve 403.

**B14 — Salir de una sala**

- **Endpoint:** `POST /api/rooms/:id/leave`.
- **Respuesta:** confirmación de que salió (`204`, sin contenido).
- **Códigos:** `204` si salió; `401` sin sesión; `404` si la sala no existe o el usuario no es miembro.
- **Necesita:** middleware de autenticación. Borrar la fila del usuario en `room_member`, emitir `room:members` y recalcular la votación para saltar (B20). Si quien sale es el anfitrión, se cierra la sala (misma lógica que `DELETE /api/rooms/:id`, **B19**). **Decisión pendiente (PM, D16):** se asume que el anfitrión puede salir y que eso cierra la sala.
- **Explicación:** permite que un usuario salga de la sala en la que está.
- **Criterios de aceptación:**
  - [ ] Un miembro que sale deja de figurar en la sala y el resto recibe `room:members`.
  - [ ] Si sale el anfitrión, la sala queda cerrada y se emite `room:closed`.

**B15 — Detalle de la sala**

- **Endpoint:** `GET /api/rooms/:id`.
- **Respuesta:** la sala con su código, anfitrión, miembros (id, username, foto y rol) y las canciones de la playlist fuente en orden de `position`.
- **Códigos:** `200` si existe; `401` sin sesión; `403` si el usuario no es miembro; `404` si la sala no existe.
- **Necesita:** middleware de autenticación, validar pertenencia a la sala, incluir `room_member` y `playlist_song` con los datos de `song`. **Nunca devolver `passwordHash`.**
- **Explicación:** alimenta la pantalla de la sala con sus miembros y su lista de canciones.
- **Criterios de aceptación:**
  - [ ] Un no miembro recibe 403.
  - [ ] Las canciones vienen ordenadas por `position`, con datos de reproducción sin llamadas extra.
  - [ ] La respuesta nunca incluye `passwordHash`.

### Frontend

**F11 — Crear sala, unirse con código y pantalla de la sala**

- **Pantalla:** `features/rooms`: pantalla "Crear sala", modal "Unirme con código" y pantalla de la sala.
- **Qué hace:** formulario con nombre, descripción (opcional), selector de playlist (**solo playlists personales con canciones**), selector Pública / Privada y campo de contraseña cuando es privada. La capacidad se muestra como dato fijo (máximo 10 miembros). Si el usuario no tiene playlists personales, el botón de crear queda deshabilitado con un mensaje y un acceso para crear una playlist. Al crear, lleva a la pantalla de la sala, donde el creador ve el código para compartirlo (junto con la contraseña si es privada). El modal "Unirme con código" pide el código y una contraseña opcional (obligatoria si la sala es privada).
- **Endpoint que consume:** B12 (`POST /api/rooms`), `GET /api/playlists`, B13 (`POST /api/rooms/join`), B14 (`POST /api/rooms/:id/leave`) y B15 para la pantalla de la sala.
- **Casos a manejar:** contraseña obligatoria en salas privadas, error 403 (contraseña incorrecta), error 404 (código inexistente), error 409 (sala llena, mostrar "Sala llena 10/10"), error 400 (sala cerrada o playlist sin canciones), loading al crear y al unirse, confirmación antes de salir de la sala.
- **Criterios de aceptación:**
  - [ ] Solo se ofrecen playlists personales con canciones.
  - [ ] Cada error (403, 404, 409, 400) muestra un mensaje entendible.
  - [ ] Salir de la sala pide confirmación.

**Dependencias:** TS-09 (Playlists personales, Sprint 1).

**⚠️ Pendiente, pero el trabajo existe sin integrar.** En `dev` no hay nada de TS-14: ni `CreateRoom.jsx`, ni
`createRoom`/`joinRoom` en `roomsService`, ni rutas. La rama **`feat/ts14-crear-sala` (`77fe367`, sin mergear)** ya
tiene `features/rooms/CreateRoom.jsx`, `features/rooms/RoomView.jsx`, `createRoom`/`joinRoom`/`getRoomById` con
persistencia en `localStorage` (`synthos_mock_rooms`), las rutas `/salas/crear` y `/salas/:id`, y 46 líneas más en
`PENDIENTES.md`. Es anterior a PR #65 (orden por rating), así que **rebasa con conflicto probable** en
`Rooms.jsx`, `roomsService.js` y `RoomCard.jsx`: hay que decidir si se rescata esa rama o se rehace sobre `dev`.
Ojo: esa rama trae `RoomView.jsx` (el componente de TS-15) pero **sin** `kickMember` ni `controlPlayback`, así que
no avanza TS-15 ni TS-18.
**Con el contrato nuevo (2026-10-16)** esa rama queda desfasada en dos puntos: su `joinRoom` entra por id (el contrato real es por **código**) y filtra playlists "propias" sin excluir colaborativas/favoritos. Si se rescata, hay que ajustar ambos.
**Efecto a tener en cuenta:** como invitar a alguien (TS-13) convierte una playlist personal en colaborativa, una playlist usada como fuente de sala dejaría de ser elegible para salas nuevas; no hay regla definida sobre qué pasa con una sala ya creada. Conviene decidirlo con el PM.

---

## TS-15 — Administrar sala de escucha (feature 11, 75%)

**Contexto:** el anfitrión controla la sala: expulsar miembros, controlar reproducción (pausar/reanudar/saltar/detener) para todos los presentes y cerrar la sala.
**Alcance:**

- Expulsar miembro (solo anfitrión).
- Control de reproducción centralizado: lo que hace el anfitrión se refleja en todos los miembros, vía WebSocket (**D8**).
- Cerrar la sala (solo anfitrión, **D15**).
- Quien entra tarde o reconecta se sincroniza con lo que ya está sonando.

**Archivos:** `src/services/roomsService.js` → `kickMember(roomId, userId)`, `controlPlayback(roomId, action)` (`play`/`pause`/`next`/`stop`; **el plan anterior decía `skip`, el contrato backend usa `next`**), `getPlayback(roomId)`, `closeRoom(roomId)`. `src/services/socketService.js` (**service nuevo, documentarlo en `AGENTS.md`**). `src/features/rooms/RoomView.jsx`. La reproducción de sala vive en el mismo `PlayerContext` en un "modo sala".
**Backend:** B11 (base de tiempo real) y B16–B19 (abajo).
**Criterios de aceptación:**

- [ ] Solo el anfitrión ve controles de administración (kick, control de reproducción, cerrar sala).
- [ ] Miembro expulsado pierde acceso a la sala y su cliente vuelve al listado con un aviso.
- [ ] Lo que hace el anfitrión (play/pause/next/stop) se refleja en los demás miembros.
- [ ] Al cerrar la sala todos los miembros reciben el aviso y salen.

### Backend

**B11 — Base de tiempo real para salas (WebSocket)** — **conviene hacerla primero**: sostiene también TS-14 (`room:members`) y TS-18.

- **Endpoint:** conexión WebSocket (Socket.IO) contra el mismo servidor, autenticada con el JWT en el handshake.
- **Respuesta:** el servidor emite eventos a los miembros de cada sala: estado de reproducción (`room:playback`), cambios de miembros (`room:members`), estado de la votación para saltar (`room:skip-votes`) y cierre de la sala (`room:closed`).
- **Códigos:** se rechaza la conexión si el token falta o es inválido, y se rechaza el ingreso al canal de una sala si el usuario no es miembro.
- **Necesita:** instalar `socket.io` en el backend. Cada sala usa un canal propio (`room:<id>`). Los clientes **solo escuchan**: los eventos los emite el servidor cuando una acción REST válida cambia el estado. El estado de reproducción de cada sala se guarda en memoria del servidor como `{ songId, status (playing | paused | stopped), positionMs, updatedAt }` con hora del servidor, para que cualquier cliente calcule la posición actual y quien entra tarde se sincronice. Se asume una sola instancia del servidor; si se reinicia, el estado se pierde (aceptable para el alcance, **D8**).
- **Explicación:** es la base de la sincronización que pide el enunciado y de las tarjetas de administrar sala y votar para saltar.
- **Criterios de aceptación:**
  - [ ] Conexión sin token o con token inválido es rechazada.
  - [ ] Un no miembro no puede entrar al canal `room:<id>`.
  - [ ] Los cuatro eventos llegan a los miembros de la sala y solo a ellos.

**B16 — Expulsar a un miembro**

- **Endpoint:** `DELETE /api/rooms/:id/members/:userId`.
- **Respuesta:** confirmación de que el miembro fue eliminado (`204`, sin contenido).
- **Códigos:** `204` si se eliminó; `400` si el anfitrión intenta eliminarse a sí mismo; `401` sin sesión; `403` si quien pide no es el anfitrión; `404` si la sala o el miembro no existen.
- **Necesita:** middleware de autenticación, validar rol `host` en `room_member`, borrar la fila del miembro, emitir `room:members` y un evento al eliminado para que su cliente salga de la sala, y recalcular la votación para saltar (B20).
- **Explicación:** permite que el anfitrión elimine miembros de la sala.
- **Criterios de aceptación:**
  - [ ] Solo el anfitrión puede expulsar; otro miembro recibe 403.
  - [ ] El expulsado recibe un evento propio y los demás reciben `room:members`.

**B17 — Controlar la reproducción**

- **Endpoint:** `POST /api/rooms/:id/playback`.
- **Body:** `{ "action": "play" | "pause" | "next" | "stop" }`.
- **Respuesta:** el estado de reproducción actualizado (canción actual, estado, posición y hora del servidor).
- **Códigos:** `200` si se aplicó la acción; `400` si la acción es inválida o la sala está cerrada; `401` sin sesión; `403` si no es el anfitrión; `404` si la sala no existe.
- **Necesita:** middleware de autenticación y validar rol `host`. Actualizar el estado en memoria: `play` inicia la primera canción si estaba detenida o reanuda desde `positionMs`; `pause` guarda la posición actual; `next` pasa a la siguiente canción según `position` (al terminar la playlist vuelve a la primera, **a confirmar, D18**) y **anula la votación en curso**; `stop` deja la reproducción detenida. Emitir `room:playback`. El cliente del anfitrión envía `next` cuando termina una canción.
- **Explicación:** da al anfitrión el control total de la reproducción sincronizada: pausar, reanudar, saltar y detener.
- **Criterios de aceptación:**
  - [ ] Solo el anfitrión puede cambiar el estado; los demás reciben 403.
  - [ ] Cada acción válida emite `room:playback` a todos los miembros.
  - [ ] `next` limpia la votación para saltar en curso.

**B18 — Consultar el estado de reproducción**

- **Endpoint:** `GET /api/rooms/:id/playback`.
- **Respuesta:** el estado de reproducción actual (canción, estado, posición y hora del servidor) y el estado de la votación para saltar (votos, votos requeridos y si el usuario ya votó).
- **Códigos:** `200` (si nunca se inició, el estado es `stopped`); `401` sin sesión; `403` si no es miembro; `404` si la sala no existe.
- **Necesita:** middleware de autenticación, leer el estado guardado en memoria.
- **Explicación:** sirve para que quien entra a la sala o reconecta se sincronice con lo que ya está sonando.
- **Criterios de aceptación:**
  - [ ] Una sala nunca iniciada responde 200 con estado `stopped`.
  - [ ] Incluye el estado de la votación para el usuario que consulta.

**B19 — Cerrar la sala**

- **Endpoint:** `DELETE /api/rooms/:id`.
- **Respuesta:** confirmación de que la sala fue cerrada (`204`, sin contenido).
- **Códigos:** `204` si se cerró; `401` sin sesión; `403` si no es el anfitrión; `404` si la sala no existe.
- **Necesita:** middleware de autenticación y validar rol `host`. Marcar `status` en cerrada, borrar el estado de reproducción en memoria y emitir `room:closed` a todos los miembros. La sala deja de aparecer en las búsquedas y no admite nuevos ingresos. **Decisión pendiente (PM, D15):** el enunciado no menciona cerrar la sala; se agrega porque sin esto las salas nunca terminan.
- **Explicación:** cierra la sala y avisa a todos sus miembros.
- **Criterios de aceptación:**
  - [ ] Solo el anfitrión puede cerrarla.
  - [ ] Una sala cerrada no aparece en `GET /api/rooms` y rechaza ingresos (400 en B13).
  - [ ] Todos los miembros reciben `room:closed`.

### Frontend

**F12 — Pantalla de la sala: reproductor sincronizado y administración**

- **Pantalla:** `features/rooms`: pantalla de la sala (reproductor sincronizado y lista de miembros) y `services/socketService.js` (service nuevo, documentarlo en `AGENTS.md`).
- **Qué hace:** al entrar a la sala conecta el socket con el JWT, pide el estado de reproducción y se mantiene sincronizado con los eventos del servidor. La reproducción de sala funciona dentro del mismo `PlayerContext` en un **"modo sala"**: el estado viene del servidor y la posición se calcula con la hora del servidor. El anfitrión ve los controles (reanudar, pausar, siguiente, detener), el botón de cerrar sala y un botón de eliminar en cada miembro. Los miembros ven el mismo reproductor sin controles. El cliente del anfitrión envía `next` cuando termina una canción.
- **Endpoint que consume:** B15 (`GET /api/rooms/:id`), B18 (`GET /api/rooms/:id/playback`), B17 (`POST /api/rooms/:id/playback`), B16 (`DELETE /api/rooms/:id/members/:userId`), B19 (`DELETE /api/rooms/:id`) y los eventos `room:playback`, `room:members` y `room:closed`.
- **Casos a manejar:** miembro eliminado (volver al listado con un aviso), sala cerrada (aviso y redirección), reconexión del socket (volver a pedir el estado), entrar con la sala ya reproduciendo (saltar a la posición actual), autoplay bloqueado por el navegador (botón "Tocar para escuchar"), confirmación antes de eliminar a un miembro y de cerrar la sala, desconectar el socket al salir de la pantalla, desactivar shuffle y repeat mientras se está en modo sala.
- **Criterios de aceptación:**
  - [ ] Un miembro que entra con la sala sonando salta a la posición actual.
  - [ ] Los miembros no ven controles; el anfitrión sí.
  - [ ] Shuffle y repeat quedan desactivados en modo sala y el socket se desconecta al salir.

**Dependencias:** TS-14, B11.

**Sin cambios: sigue pendiente.** No hay `RoomView.jsx` en `dev` (solo existe en la rama `feat/ts14-crear-sala`), ni
`kickMember`/`controlPlayback` en `roomsService`, ni control de reproducción por sala. **D8 quedó resuelta
(2026-10-16):** la sincronización va por Socket.IO, así que esta tarea ya no está bloqueada por decisión, sino por
**B11** (no existe `socket.io` en el backend ni `socketService.js` en el frontend).

---

## TS-16 — Buscar salas de escucha (feature 18, 75%)

**Contexto:** buscar salas **públicas y activas** por nombre de sala o nombre de usuario (anfitrión), con criterio y sentido de orden elegibles. Las salas privadas no aparecen en la búsqueda: se entra a ellas con su código (**D14**).
**Alcance:**

- Input de búsqueda por nombre de sala o anfitrión, con debounce.
- Selector de criterio (Nombre / Calificación del anfitrión) y botón para alternar ascendente/descendente.
- Resultados con nombre, anfitrión con su calificación, miembros ("3/10") y botón "Unirme".
- Resultados vacíos → mensaje informativo, no pantalla en blanco.

**Archivos:** `src/features/search/SearchRooms.jsx` (según el plan original) **o** el buscador dentro de la pantalla "Salas" existente (`features/rooms`, accesible desde BottomNav y Sidebar), que es donde el detalle nuevo la ubica: decidir una de las dos. Extender `roomsService.js` con `searchRooms(query, sort, order)`. Resultados con `RoomListItem` (nombre, anfitrión con calificación, miembros "3/10") y botón "Unirme"; hoy existe `RoomCard`, reutilizarlo o reemplazarlo sin duplicar. Adapta el selector de orden ya hecho en TS-17.
**Backend:** **B21** (abajo), que modifica el `GET /api/rooms` existente (**D7**).
**Criterios de aceptación:**

- [ ] Búsqueda funciona por nombre de sala Y por nombre de usuario anfitrión.
- [ ] Selector de criterio y botón asc/desc cambian el orden visiblemente.
- [ ] Estado vacío manejado ("No encontramos salas con ese criterio").
- [ ] Las salas privadas y las cerradas no aparecen.

### Backend

**B21 — Buscar salas**

- **Endpoint:** `GET /api/rooms?query=&sort=name|rating&order=asc|desc` (**modificar el existente**).
- **Respuesta:** las salas públicas y activas cuyo nombre o cuyo anfitrión (`username`) coincide con el texto, ordenadas según `sort` y `order`. Cada sala incluye código, nombre, anfitrión (id y username), calificación del anfitrión (`avg_rating`), cantidad de miembros y capacidad máxima.
- **Códigos:** `200` siempre (lista vacía si no hay coincidencias); `400` si `sort` u `order` tienen un valor inválido.
- **Necesita:** sumar a la consulta actual el filtro de texto con `ILIKE` sobre `room.name` y el `username` del anfitrión (query vacío devuelve todas), filtrar `is_private = false` y `status = 'activa'`, aceptar `order` (por defecto `asc`) y sumar el conteo de `room_member` por sala. Mantener el desempate alfabético en el orden por rating. **Sin paginación**, porque el enunciado no la pide.
- **Explicación:** busca salas por nombre o anfitrión y deja elegir el criterio y el sentido del orden. Las salas privadas no aparecen en la búsqueda y se entra a ellas con su código.
- **Criterios de aceptación:**
  - [ ] Coincide por nombre de sala y por username del anfitrión; query vacío devuelve todas las públicas activas.
  - [ ] Privadas y cerradas nunca aparecen.
  - [ ] `sort` u `order` inválidos devuelven 400; sin coincidencias, 200 con lista vacía.

### Frontend

**F14 — Pantalla "Salas" con buscador y filtros**

- **Pantalla:** `features/rooms`: pantalla "Salas" (BottomNav y Sidebar) con buscador y filtros.
- **Qué hace:** input de búsqueda por nombre de sala o anfitrión, selector de criterio (Nombre / Calificación del anfitrión) y un botón para alternar entre sentido ascendente y descendente. Los resultados se muestran con `RoomListItem` (nombre, anfitrión con su calificación, miembros "3/10") y un botón "Unirme". Adapta el selector de orden ya hecho en TS-17.
- **Endpoint que consume:** B21 (`GET /api/rooms?query=&sort=&order=`), B13 (`POST /api/rooms/join`).
- **Casos a manejar:** estado sin resultados con mensaje informativo ("No encontramos salas con ese criterio"), debounce en el input, `avg_rating` puede llegar como string (convertir con `Number()`) y 0 se muestra como "Sin calificaciones", sala llena (botón de unirme deshabilitado), mantener búsqueda y orden al volver a la pantalla, loading.
- **Criterios de aceptación:**
  - [ ] La búsqueda y el orden se mantienen al volver a la pantalla.
  - [ ] Sala llena (10/10) tiene el botón de unirme deshabilitado.
  - [ ] Sin resultados muestra el mensaje informativo.
- **Notas de integración:** (1) el frontend hoy usa `?sort=alphabetical|rating` en la URL y el backend define `sort=name|rating`: mapear en el service. (2) `RoomCard` hoy muestra "Sin calificar" cuando `hostRating === null`; el detalle nuevo pide "Sin calificaciones" para 0: unificar texto y criterio (null vs 0) con el equipo.

**Dependencias:** TS-14.

**Sin cambios: sigue pendiente, y no es solo trabajo de frontend.** No existe `features/search/SearchRooms.jsx` ni
`searchRooms()` en `roomsService` (solo `listRooms({ sort })`), y `/salas` no tiene input de búsqueda. Del lado del
backend, `GET /api/rooms` **solo valida `sort`** (`validateSortType`): no acepta `query` ni devuelve el nombre del
anfitrión, así que el criterio "por nombre de usuario anfitrión" no se puede cumplir filtrando en el cliente.
**D7 quedó definida (2026-10-16)** en **B21**, pero sigue sin implementarse. Lo único reutilizable de TS-17 es el
`?sort=` en la URL y el `RoomSortMenu`.

---

## TS-17 — Ordenar salas por calificación del anfitrión + conectar listado al backend (feature 16, 25%; ex F8)

**Contexto:** al buscar salas públicas, ordenar resultados por calificación del anfitrión (mejor calificado primero). Calificación visible en la tarjeta de sala. Hoy el frontend usa datos ficticios; el listado debe venir del backend real.
**Alcance:**

- Extiende TS-16: criterio de orden adicional "por calificación de anfitrión" junto a asc/desc por nombre.
- **F8:** conectar el servicio y la pantalla de listado a `GET /api/rooms` (sin ID de backend nuevo, el endpoint ya existe).

**Archivos:** extender `searchRooms()` en `roomsService.js` con parámetro de criterio de orden. Mostrar `hostRating` (de TS-11) en la tarjeta de sala.
**Falta (F8):** **Inconsistencia: la funcionalidad existe solo en frontend con datos ficticios.** Quitar el modo de prueba del servicio; mapear la respuesta real a la forma que usa la UI (**D7**); estado de carga y de error propios de llamada real; manejar salas sin calificación; verificar que el orden del servidor se respeta sin reordenar en el navegador.
**Criterios de aceptación:**

- [X] Nueva opción de orden "Mejor calificado" disponible junto a asc/desc.
- [X] Calificación del anfitrión visible en cada card de resultado (o "Sin calificar").
- [X] Ordenar por "Mejor calificado" funciona con datos del servidor.
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

**Actualización (2026-10-16):** el contrato definitivo de `GET /api/rooms` queda en **B21** (`sort=name|rating`, `order=asc|desc`, `avg_rating`, miembros y capacidad). Apagar `USE_MOCK` conviene hacerlo junto con **F14** (TS-16), porque ambos tocan `roomsService.js` y la respuesta cambia de forma. Recordar que `avg_rating` puede llegar como string: convertir con `Number()`.

---

## TS-18 — Votar para saltar canción (feature 12, 75%)

**Contexto:** en una sala, un miembro no-administrador puede votar para saltar la canción actual. Se aprueba por mayoría de los **miembros que no son anfitrión** (**D17**, decisión pendiente PM; ej. 3 miembros requieren 2 votos). Cada miembro vota una vez por canción. El admin no vota; si el admin salta directamente (`next`), cancela cualquier votación en curso.
**Alcance:**

- Botón "Votar para saltar" visible solo para no-administradores; el anfitrión ve solo el contador.
- Contador de votos sobre votos requeridos, resolución automática al alcanzar mayoría.
- Reset del contador y del botón al cambiar de canción (también si la playlist se repite).
- Recalcular los votos requeridos si un miembro sale o es eliminado.

**Archivos:** `src/services/roomsService.js` → `voteSkip(roomId)`, `getSkipVoteStatus(roomId)` (el estado de la votación llega con `GET /api/rooms/:id/playback` y el evento `room:skip-votes`).
**Backend:** B20 (abajo).
**Criterios de aceptación:**

- [ ] Administrador no ve/no puede usar el botón de votar.
- [ ] Un miembro no puede votar dos veces por la misma canción.
- [ ] Acción directa de "saltar" (`next`) del admin cancela la votación en curso.
- [ ] Al aprobarse, la canción avanza y el contador se reinicia para todos.
- [ ] Aplica la misma decisión de sincronización que TS-15 (**D8**: Socket.IO).

### Backend

**B20 — Votar para saltar**

- **Endpoint:** `POST /api/rooms/:id/skip-votes`.
- **Respuesta:** el estado de la votación: votos actuales, votos requeridos y si la canción fue saltada.
- **Códigos:** `201` si se registró el voto; `400` si no hay canción sonando o la sala está cerrada; `401` sin sesión; `403` si el usuario no es miembro o es el anfitrión; `404` si la sala no existe; `409` si ya votó por la canción actual.
- **Necesita:** middleware de autenticación. El anfitrión no puede votar. Guardar los votos **en memoria** junto al estado de reproducción (B11), asociados a la reproducción actual, de modo que cada miembro vote una sola vez por canción y los votos se limpien al cambiar de canción (también si la playlist se repite). La votación se aprueba con más de la mitad de los miembros que no son anfitrión (**D17**). Al aprobarse, avanzar a la siguiente canción con la misma lógica de `next` (B17), limpiar los votos y emitir `room:playback`. Emitir `room:skip-votes` en cada voto. Si un miembro sale o es eliminado, recalcular los votos requeridos. Si el anfitrión salta con `next`, la votación en curso se anula.
- **Explicación:** permite que los miembros decidan saltar la canción actual sin que intervenga el anfitrión.
- **Criterios de aceptación:**
  - [ ] Con 3 miembros no anfitrión se requieren 2 votos y el segundo avanza la canción.
  - [ ] Segundo voto del mismo miembro por la misma canción devuelve 409.
  - [ ] El anfitrión recibe 403; sin canción sonando, 400.

### Frontend

**F13 — Votar para saltar en el reproductor de la sala**

- **Pantalla:** `features/rooms`: zona del reproductor en la pantalla de la sala.
- **Qué hace:** los miembros que no son anfitrión ven el botón "Votar para saltar" y un contador de votos sobre votos requeridos. Después de votar, el botón queda deshabilitado hasta que cambie la canción. El anfitrión no ve el botón de votar, solo el contador. Cuando la votación se aprueba, el cambio de canción llega por el evento de reproducción y el contador se reinicia.
- **Endpoint que consume:** B20 (`POST /api/rooms/:id/skip-votes`), B18 (`GET /api/rooms/:id/playback`, trae el estado de la votación) y el evento `room:skip-votes`.
- **Casos a manejar:** error 409 (ya votaste), error 403, botón deshabilitado si no hay canción sonando, reinicio del estado del botón al cambiar de canción, actualización del contador cuando alguien sale o es eliminado.
- **Criterios de aceptación:**
  - [ ] Después de votar el botón queda deshabilitado hasta que cambie la canción.
  - [ ] El contador se actualiza en vivo con `room:skip-votes`.
  - [ ] El anfitrión ve solo el contador.

**Dependencias:** TS-15 (B11, B17, F12).

**Sin cambios: sigue pendiente.** No hay `voteSkip` ni `getSkipVoteStatus`, no hay `RoomView.jsx` en `dev`.
Sobre el hueco que marcaba `CONTEXT.md` §3 ("el esquema no tiene dónde guardar los votos"): **con el diseño
nuevo no hace falta migración**, porque los votos viven en memoria junto al estado de reproducción (se pierden si el
servidor se reinicia, igual que ese estado). Depende de TS-15; **D8 quedó resuelta** (Socket.IO) y la
interpretación de "mayoría" está en **D17** (pendiente de PM).

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

Estado al 2026-10-15, sobre `dev`: **entregadas** TS-10, TS-10b, TS-12, TS-13, TS-19 (completa), TS-20 (completa) y
TS-21. Con **D1, D2, D3, D4, D8, D9, D11, D12, D14 resueltas**; **D10 quedó obsoleta** (la invitación es dirigida, no un link).

1. **TS-19**, **TS-20**, **TS-21**, **TS-10 / TS-10b**, **TS-12**, **TS-13**: entregadas.
2. **B11 (base de tiempo real, Socket.IO)** → primero del bloque de salas: la usan TS-14 (`room:members`), TS-15 y TS-18.
3. **TS-14** → B12, B13, B15 y B19 (B14 reutiliza la lógica de cierre de B19), luego F11. Decidir si se rescata `feat/ts14-crear-sala` (rebasa con conflicto en `Rooms.jsx`/`roomsService.js`; su `joinRoom` entra por id y hay que pasarlo a código) o se rehace sobre `dev`. Es el bloque que habilita TS-11, TS-15 y TS-18.
4. **TS-15** → B16, B17, B18 y B19, luego F12 (con `socketService.js` y el "modo sala" del `PlayerContext`). Ya no la bloquea D8, sí B11.
5. **TS-18** → B20 (usa la lógica de `next` de B17) y luego F13.
6. **TS-16 + TS-17 (F8)** → B21 (`GET /api/rooms` con `query`, `order`, anfitrión y miembros) y F14; al mismo tiempo se apaga `roomsService.USE_MOCK`. Resuelve **D7**.
7. **TS-11** → detrás de **D5** (alta de `POST /api/rooms/:id/rating`) y **D6** (qué es "positiva"). Fuera de las entregas del 75%.

> **Decisiones pendientes de PM introducidas el 2026-10-16:** D15 (endpoint para cerrar sala), D16 (el anfitrión que sale cierra la sala), D17 (mayoría sobre miembros no anfitrión) y D18 (al terminar la playlist vuelve a la primera, a confirmar).

> Decisión del usuario (2026-10-15) que queda para lo que viene: en una playlist colaborativa **cualquier participante
> puede agregar y quitar canciones**, y el creador suma invitar y echar. Si alguna otra feature (salas, recomendaciones)
> necesita otro reparto de permisos, es el mismo criterio para decidir.

---

## Cierre del bloque de salas (2026-10-18)

**TS-11, TS-14, TS-15, TS-16, TS-17 y TS-18 quedan entregados de punta a punta.** El detalle de
cada fase, las decisiones que se tomaron y los criterios de aceptación están en
`docs/plan/sprint-2-salas-plan.md` (que es el plan que se escribió para este bloque); acá solo se
registra el desenlace para que el histórico del sprint no diga "pendiente".

**Cómo se resolvió lo que estaba abierto en este documento:**

| Decisión de acá | Cómo quedó |
| --- | --- |
| **D8** (sincronización) | WebSocket con Socket.IO, handshake por JWT, estado de reproducción **en memoria del proceso**. Resuelto en el plan de salas como **D8′**, que además aclara el límite: exige backend Node persistente. |
| **D15** (cerrar la sala) | `DELETE /api/rooms/:id`, solo anfitrión, emite `room:closed`. |
| **D16** (el anfitrión sale) | Se asume lo que decía el plan: **salir cierra la sala**, sin transferencia de rol. |
| **D17** (mayoría del skip) | Más de la mitad de los miembros que **no** son anfitrión. |
| **D18** (fin de la playlist) | `next` en la última canción vuelve a la primera. |
| **D5/D6 de TS-11** (alta y criterio de la calificación) | `POST /api/rooms/:id/rating` existe y recibe `rating` (1–5) en el body. El botón de la sala manda `1`. |
| **D14** (privadas en la búsqueda) | Se respetó: no aparecen en el listado, se entra con código y contraseña. |
| **D7** (respuesta de `GET /rooms`) | Resuelta en B21: `query`, `sort`, `order`, anfitrión, `members_count`, `songs_count` y filtro de status. |

**Se agregaron además, porque los frontend los necesitaban:**

- `GET /api/rooms/mine`, para el grupo "Mis Salas" del Sidebar.
- `hostAvgRating` y `viewerHasRated` en el detalle de la sala, y `hostRating`/`hostRatingsCount` en
  `GET /users/:id` y `/users/me` (sin esto el perfil del anfitrión no podía mostrar la calificación
  que TS-11 accumulate).
- `songs_count` en el listado, para que la tarjeta no pierda el dato de cuántas canciones tiene.

**Correcciones sobre lo que venía implementado** (el backend del bloque llegó en el PR #82 más una
rama `FEATURE/rate-host` sin mergear; se corrigió antes de seguir):

- `POST /rooms` y `POST /rooms/join` **filtraban `passwordHash`** en la respuesta, y el listado
  público proyectaba `room.*` y lo devolvía entero. Ahora las columnas van una por una y hay un
  `safeRoom` para los endpoints que devuelven la sala entera.
- `pause` no guardaba la posición real: **pausar reiniciaba la canción para todos**.
- `deleteRoomState` nunca se llamaba, así que el estado en memoria sobrevivía al cierre de la sala.
- `createRoom` exigía playlist `personal` y creada por el usuario, lo que contradecía **D19**
  (cualquier playlist, y cualquier miembro de una colaborativa puede abrir sala).
- El seed usaba IDs de canción hardcodeados que no existen en la base de cada uno: ahora toma las
  primeras 6 canciones existentes como *pool*.

**Lo que sigue abierto del bloque:** el **chat de salas** (no hay tabla `room_message` ni eventos
que lo transmitan). Ver `docs/PENDIENTES.md` §5.6b para la lista completa de deudas.
