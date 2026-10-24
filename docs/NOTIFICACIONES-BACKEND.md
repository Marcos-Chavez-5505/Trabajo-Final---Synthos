# Notificaciones — guía de backend y tiempo real

> **Estado:** backend y frontend conectados. El frontend usa
> `shared/src/services/notificationsService.js` + `shared/src/features/notifications/useNotifications.js`
> para listar/marcar y escucha `notification:new`, `notification:read` y
> `notification:read-all` por el socket existente. Ya no usa `notificationsMock.js`.

## 1. Qué se notifica y cuándo

| Tipo (`type`)          | Se dispara cuando…                                                                 | Destinatario        |
| ---------------------- | ---------------------------------------------------------------------------------- | ------------------- |
| `follow`               | `POST /api/users/:id/follow` crea un follow nuevo (no cuando ya lo seguía)          | El usuario seguido  |
| `recommendation`       | `POST /api/users/:id/recommendations` crea la recomendación y su `content_playement` | El usuario destino  |
| `playlist_invitation`  | `POST /api/playlists/:id/invitation` crea o reactiva una invitación pendiente      | El usuario invitado |

Reglas:

- Nunca notificar al actor de su propia acción. El backend ya rechaza seguirse a
  uno mismo, recomendarse y autoinvitarse.
- En follow, emitir solo si `followService.followUser()` devolvió `{ followed: true }`.
  Si devuelve `alreadyFollowing`, no hay notificación nueva.
- En invitaciones, emitir solo si se creó/reactivó una invitación pendiente. El
  servicio actual usa `upsert`: si la misma persona ya estaba invitada, puede
  actualizar el `idSender`. Decidí si eso merece una notificación nueva o no;
  para empezar, notificá cuando el estado anterior no era `pendiente`.
- La recomendación ya exige seguimiento mutuo (`FOLLOW_REQUIRED` en el
  controller actual). La notificación va después de que la transacción de
  `Content` + `ContentPlayement` terminó bien.

## 2. Persistir, no derivar en cada GET

Se podría armar la bandeja leyendo `follow`, `content` y
`playlist_invitation`, pero no conviene:

- no habría estado de leída;
- cambiaría el pasado si se borra un follow o una playlist;
- el listado sería una unión cara de tres tablas;
- no se podría paginar ni ordenar con una sola clave.

Por eso: **una fila por notificación**, creada en el momento del evento. El
WebSocket solo avisa que la fila nueva existe; la fuente de verdad sigue siendo
PostgreSQL.

## 3. Modelo Prisma propuesto

Adaptá los nombres al estilo del `schema.prisma` actual (snake_case en
`@@map`/`@map` y enums en minúscula):

```prisma
enum NotificationType {
  follow
  recommendation
  playlist_invitation

  @@map("notification_type")
}

model Notification {
  id         Int              @id @default(autoincrement())
  idUser     Int              @map("id_user")
  idActor    Int              @map("id_actor")
  type       NotificationType
  idSong     Int?             @map("id_song")
  idPlaylist Int?             @map("id_playlist")
  isRead     Boolean          @default(false) @map("is_read")
  createdAt  DateTime         @default(now()) @map("created_at") @db.Timestamp(6)

  user     User     @relation("NotificationReceiver", fields: [idUser], references: [id], onDelete: Cascade)
  actor    User     @relation("NotificationActor", fields: [idActor], references: [id], onDelete: Cascade)
  song     Song?    @relation(fields: [idSong], references: [id], onDelete: SetNull)
  playlist Playlist? @relation(fields: [idPlaylist], references: [id], onDelete: SetNull)

  @@index([idUser, isRead, createdAt])
  @@map("notification")
}
```

Y las relaciones inversas:

```prisma
model User {
  // …
  notificationsReceived Notification[] @relation("NotificationReceiver")
  notificationsSent     Notification[] @relation("NotificationActor")
}

model Song {
  // …
  notifications Notification[]
}

model Playlist {
  // …
  notifications Notification[]
}
```

Notas:

- `idUser` es el destinatario; el evento siempre lo decide el backend, nunca el
  cliente.
- `idSong` e `idPlaylist` son opcionales según el tipo. La UI puede ignorar los
  campos que no le corresponden.
- Si querés deduplicar recomendaciones o enlazar al `content` exacto, agregá
  `idContent Int?` con `onDelete: SetNull`. Para la primera versión no es
  necesario: con `idSong` alcanza para el copy "te recomendó X".
- El índice `[idUser, isRead, createdAt]` cubre el listado y el contador de no
  leídas.

Después: `npx prisma migrate dev --name add_notifications` y `npx prisma generate`.

## 4. Contrato REST

Todas las rutas van detrás de `authenticate`, igual que el resto de los recursos
privados. El `idUser` sale de `req.user.sub`, no de la URL ni del body.

### `GET /api/notifications`

Query params:

| Parámetro  | Default | Límite |
| ---------- | ------- | ------ |
| `page`     | `1`     | ≥ 1    |
| `pageSize` | `20`    | 1–50   |

Respuesta:

```json
{
  "status": "success",
  "notifications": [
    {
      "id": 18,
      "type": "recommendation",
      "isRead": false,
      "createdAt": "2026-10-24T14:32:00.000Z",
      "actor": { "id": 24, "username": "tomi", "avatarUrl": null },
      "song": { "id": 31, "title": "Nocturno", "artist": "Lara Gris" },
      "playlist": null
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 6,
  "totalPages": 1,
  "unreadCount": 3
}
```

- Orden: `createdAt: "desc"` (y `id: "desc"` como desempate).
- `actor`: solo `id`, `username`, `pictureUrl` mapeado a `avatarUrl`.
- `song`: `id`, `title`, `artist.name` como string, opcionalmente `coverUrl`.
- `playlist`: `id`, `name`.
- `unreadCount` se calcula con un `count` aparte, en paralelo con la página.
- Reutilizá `utils/pagination.js` (`paginatedSearch`) o el mismo envelope que
  usan artistas/búsqueda. No inventes otro formato.

### `PATCH /api/notifications/:id/read`

Marca una notificación del usuario autenticado como leída.

```json
{ "status": "success", "notification": { "id": 18, "isRead": true }, "unreadCount": 2 }
```

- Buscá por `id` **y** `idUser` en la misma condición. Si no existe, respondé
  `404 NOTIFICATION_NOT_FOUND`; no respondas 403, para no revelar ids ajenos.
- Si ya estaba leída, devolvé 200 igual (idempotente).

### `PATCH /api/notifications/read-all`

```json
{ "status": "success", "unreadCount": 0 }
```

- `updateMany({ where: { idUser, isRead: false }, data: { isRead: true } })`.
- Declarala **antes** de `/:id/read` si alguna vez agregás rutas de un solo
  segmento, para evitar que `read-all` se interprete como un id.

### Opcional: `GET /api/notifications/unread-count`

Si el badge del sidebar se muestra en todas las pantallas, conviene un endpoint
barato que devuelva solo `{ "unreadCount": 3 }`, en vez de bajar la primera
página completa. También puede venir en `GET /api/users/me` si ya se llama al
iniciar la app.

## 5. Servicio y controller

Separación recomendada:

```text
Backend/src/
├── controller/notification.controller.js   # HTTP, ownership, status codes y eventos de lectura
├── services/notification.service.js        # Prisma, DTO, paginación y emisión del socket
└── routes/notification.routes.js           # GET /, PATCH /:id/read, PATCH /read-all
```

Funciones del service:

```js
createNotification({ idUser, idActor, type, idSong, idPlaylist })
notifyUser(io, { idUser, idActor, type, idSong, idPlaylist })
listNotifications(idUser, { page, pageSize })
markAsRead(idUser, notificationId)
markAllAsRead(idUser)
countUnread(idUser)
```

El controller no arma SQL ni DTOs; el service devuelve la fila con
`actor`, `song` y `playlist` incluidos, y un mapper la convierte al contrato de
la sección 4.

Montaje en `app.js`:

```js
app.use("/api/notifications", notificationRoutes);
```

## 6. Crear la notificación en los tres eventos

La acción principal (seguir, recomendar, invitar) nunca debe fallar porque falló
la notificación. La recomendación práctica es:

1. ejecutar la mutación principal;
2. si salió bien, crear la notificación en un `try/catch`;
3. si falla, loguear el error y responder igual la acción principal;
4. si se creó, emitir el evento.

Si preferís consistencia estricta, meté la creación dentro de la misma
transacción de la acción principal. El costo es que un problema en
`notification` bloquea el follow/recomendación/invitación. Para esta app, la
primera opción (best effort) es más tolerante.

Puntos de inserción:

### Follow — `follow.controller.js`

```js
const result = await followService.followUser(followerId, followedId);

if (result.alreadyFollowing) {
  return res.status(200).json({ status: "success", message: "Ya seguís a este usuario." });
}

await notificationService.notifyUser(req.app.get("io"), {
  idUser: followedId,
  idActor: followerId,
  type: "follow",
});
```

### Recomendación — `recommendation.controller.js`

Después de `createRecommendation()`:

```js
await notificationService.notifyUser(req.app.get("io"), {
  idUser: targetId,
  idActor: authorId,
  type: "recommendation",
  idSong: songId,
});
```

### Invitación — `playlist.controller.js`

Después de `playlistService.createInvitation()` y de descartar
`alreadyMember`. El service devuelve `shouldNotify` para no volver a avisar
cuando la invitación ya estaba pendiente:

```js
if (invitation.shouldNotify) {
  await notificationService.notifyUser(req.app.get("io"), {
    idUser: receiverId,
    idActor: userId,
    type: "playlist_invitation",
    idPlaylist: id,
  });
}
```

`notifyUser` vive en `notification.service.js` y hace el `try/catch` + `emit`
en un solo lugar, para no repetir lógica en los tres controllers.

## 7. WebSocket: el mismo socket que ya existe

El backend ya tiene:

- autenticación JWT en el handshake (`Backend/src/index.js`);
- cada socket conectado entra a `user:<id>`, su canal personal;
- `app.set("io", io)` para que los controllers accedan al servidor.

Entonces no hace falta una conexión nueva ni una sala nueva. Alcanza con emitir
al canal personal del destinatario:

```js
function emitNotification(io, notification) {
  if (!io) return;

  io.to(`user:${notification.idUser}`).emit("notification:new", toNotificationDto(notification));
}
```

- **Nombre del evento:** `notification:new`.
- **Payload:** exactamente el mismo DTO que devuelve el REST. Así el frontend
  puede insertar el objeto en la lista sin volver a pedir la página.
- **Después del commit:** emití recién cuando la fila ya está en PostgreSQL. Si
  emitís antes y la transacción falla, el cliente muestra algo que no existe.
- **Usuario desconectado:** no hay problema. La fila queda persistida y aparece
  en el próximo `GET /api/notifications`. El socket no es una cola.

### Sincronizar lecturas entre dispositivos (opcional)

Si la misma cuenta está abierta en web y mobile, conviene que marcar como leída
en un dispositivo actualice el badge del otro. Mantené la misma idea
“REST muta, socket avisa”:

```js
io.to(`user:${userId}`).emit("notification:read", { id, unreadCount });
io.to(`user:${userId}`).emit("notification:read-all", { unreadCount: 0 });
```

El cliente que hizo la mutación también recibe el evento y actualiza el badge.

### Lo que NO debe hacer el cliente

- No emitir “crear notificación”. Eso lo decide el backend a partir de una acción
  real.
- No mandar `idUser` desde el cliente para elegir destinatario.
- No confiar en el payload del socket para autorizar: el socket ya autenticó el
  handshake, pero el emisor sigue siendo el servidor.

## 8. Frontend: cómo reemplazar el mock

Cuando el backend esté listo:

1. Crear `shared/src/services/notificationsService.js` con:
   - `listNotifications({ page, pageSize })`;
   - `markNotificationRead(id)`;
   - `markAllNotificationsRead()`;
   - el mapper `toNotification` con la misma forma que `notificationsMock.js`.
2. Exportarlo desde `shared/src/index.js`.
3. Agregar un hook compartido (por ejemplo `useNotifications`) que:
   - cargue la primera página;
   - escuche `notification:new`, `notification:read` y `notification:read-all`;
   - deduplique por `id` al insertar un evento nuevo;
   - vuelva a pedir la lista al reconectar.
4. En `Frontend/src/features/notifications/Notifications.jsx`, cambiar
   `mockNotifications` por el hook. La presentación (`NotificationRow`) no
   debería cambiar.
5. Si el evento llega mientras no se está en la pantalla, guardá el contador no
   leído en un contexto o en el hook global para el badge del sidebar.

Detalle actual del `socketService` compartido: `connectSocket()` abre una sola
conexión y `subscribeToRoomEvent()` registra handlers sobre ella. Podés
reutilizarlo para notificaciones, pero el nombre queda chico: conviene renombrar
a `subscribeToSocketEvent()` o exportar un `subscribeToNotificationEvent()`
como alias, sin duplicar la conexión.

## 9. Adaptación a mobile

La lógica puede vivir en `shared/`; la pantalla nativa se hace aparte:

- **Contrato:** el DTO de la sección 4 es el mismo para web y mobile. No mandes
  HTML ni textos armados desde el backend; mandá `type`, `actor`, `song`,
  `playlist`, `isRead` y `createdAt` para que cada app arme su copy.
- **Pantalla:** en React Native, la bandeja es un `FlatList` con el mismo
  `NotificationRow` conceptual. Mantené `keyExtractor={item.id}`, pull-to-refresh
  y un `onEndReached` para la página siguiente.
- **Token:** en mobile el token vive en `expo-secure-store`; el handshake del
  socket tiene que usar el token de `getAuthToken()` después de restaurar la
  sesión, igual que la API.
- **URL del socket:** hoy `connectSocket()` llama a `io()` sin URL, lo que
  funciona en web por el proxy de Vite. En mobile no hay proxy: hay que pasarle
  el origen de `getApiBaseUrl()` (quitando el sufijo `/api`). Si no, el socket
  intenta conectarse al servidor de Expo. Esto conviene resolverlo en
  `shared/src/services/socketService.js` antes de llevar notificaciones a
  `mobile/`.
- **Reconexión:** al volver del background, `AppState` puede cambiar a
  `active`; ahí reconectá y hacé un `GET` de la lista. Los eventos que llegaron
  mientras la app estaba suspendida no se recuperan por socket, pero sí por la
  base de datos.
- **WebSocket no es push:** con la app cerrada o en background el sistema puede
  matar la conexión. Para notificaciones reales de mobile hace falta push
  (Expo Notifications / FCM / APNs) y guardar el `pushToken` del dispositivo en
  el backend. El WebSocket sirve para la app abierta y para actualizar la UI en
  vivo.

## 10. Seguridad y errores

- Todas las rutas de lectura/marcado usan `authenticate`.
- Un usuario solo puede leer y marcar **sus** notificaciones (`idUser =
  req.user.sub`).
- Si el id no existe o es de otra persona: `404` con código
  `NOTIFICATION_NOT_FOUND`.
- Validá `page`/`pageSize` con el helper existente; no dejes que un `pageSize`
  gigante baje toda la tabla.
- No incluyas datos privados del actor que no estén ya en un perfil público
  (`id`, `username`, `pictureUrl` alcanzan).
- No guardes tokens ni payloads de socket en logs.

## 11. Orden sugerido de implementación

1. Agregar el modelo y la migración; correr `prisma generate`.
2. Crear `notification.service.js` con `createNotification`,
   `listNotifications`, `markAsRead`, `markAllAsRead` y `toNotificationDto`.
3. Crear controller y rutas; montar `/api/notifications`.
4. Probar con `curl` el listado, el marcado y el `read-all` (primero sin socket).
5. Enganchar la creación en follow, recomendación e invitación.
6. Emitir `notification:new` desde los tres puntos y verificar con dos sesiones
   de usuarios distintos.
7. Agregar `notification:read` / `notification:read-all` si vas a sincronizar
   varios dispositivos.
8. Recién entonces cambiar el mock del frontend por el service y el hook.
9. Antes de mobile, corregir la URL del socket en `shared/`.
10. Después, evaluar push notifications para background.

## 12. Pruebas mínimas

- `GET /api/notifications` sin token → 401.
- `GET` con token → solo las del usuario, ordenadas y con `unreadCount` correcto.
- `PATCH /:id/read` de una notificación ajena → 404.
- `PATCH /read-all` → todas leídas, `unreadCount: 0`.
- Seguir a alguien desde otra sesión → llega `notification:new` y la fila
  aparece al recargar.
- Seguir a alguien que ya seguías → no se duplica la notificación.
- Recomendar una canción → el destinatario recibe `recommendation`.
- Invitar a una playlist → el destinatario recibe `playlist_invitation`.
- Cerrar sesión y volver a entrar → no quedan sockets con el token viejo.
- Mobile: app en foreground recibe el evento; al volver del background, el
  `GET` recupera lo que se perdió.

## 13. `curl` de referencia

Reemplazá `<TOKEN>` y los ids:

```bash
# Listado
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3000/api/notifications?page=1&pageSize=20"

# Marcar una
curl -X PATCH -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3000/api/notifications/18/read"

# Marcar todas
curl -X PATCH -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:3000/api/notifications/read-all"
```
