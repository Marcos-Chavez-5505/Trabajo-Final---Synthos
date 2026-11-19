# Plan — Redirección al perder el acceso a una sala

## Problema

Un usuario expulsado (por inactividad o por el anfitrión) se quedaba en la pantalla de la
sala. El job de inactividad solo expulsa a invitados **sin sockets**, así que no recibía
ningún evento; al reconectar, `join-room` fallaba en silencio y la página nunca volvía a
pedir la sala. El `403` recién aparecía al recargar, y se mostraba como un error genérico
(la sala seguía montada). El kick manual sí abría un modal, pero la redirección dependía de
que el usuario lo cerrara.

## Diseño

1. **Backend**
   - `ROOM_ACCESS_LOST` como `code` estable del `403` de `GET /rooms/:id`,
     `GET /rooms/:id/playback` y `POST /rooms/:id/skip-votes` cuando falta la membresía.
   - `reason`: `kicked` | `inactivity` | `not_member`, resuelto en
     `room.service.getRoomAccessLostReason` con este orden:
     `room_kicked` → `kicked`; marcador de inactividad vigente → `inactivity`; si no →
     `not_member`.
   - `join-room` responde el mismo `code` + `reason` en el evento `error` de Socket.IO.
   - El job de inactividad emite `room:expelled { roomId, reason: "inactivity" }` al canal
     `user:<id>` después de borrar la membresía.
   - **Marcador en memoria** (`Backend/src/realtime/roomExpulsions.js`): `Map`
     `(roomId, userId) → vencimiento`, TTL `ROOM_EXPULSION_MARKER_TTL_MS` (default 24 h,
     `0` lo desactiva). El job lo escribe **después** de `leaveRoom` (que lo borra), y
     `joinRoom`/la salida voluntaria también lo borran: quien se va por su cuenta no queda
     etiquetado como inactivo. Se limpia por TTL al consultar y en cada pasada del job, para
     que el `Map` no crezca sin límite.

2. **Shared**
   - `ApiError` expone `reason` (opcional).
   - `useRoomAccessGuard(roomId, { onLost })`: escucha `room:expelled`, `room:kicked` y el
     `error` de `join-room`, todos filtrados por `roomId`; `reportError(cause)` rutea los
     `403` de la API. Dispara `onLost(reason)` **una sola vez** (flag por ref) aunque lleguen
     varios eventos casi juntos, y llama a `leaveRoomChannel(roomId)` para que la próxima
     reconexión no vuelva a emitir `join-room` sobre una sala perdida. No navega ni muestra
     nada: cada plataforma decide el toast y la redirección.
   - `useMyRooms` también escucha `room:expelled` para refrescar "Mis Salas" del sidebar
     (antes solo escuchaba `room:kicked` y `room:closed`).

3. **Web** (`Frontend/src/pages/rooms/RoomPage.jsx`)
   - El guard muestra `toastMessages.roomAccessLost(reason)` y navega a `/salas` con
     `replace: true`.
   - El `catch` de la carga, del playback y de `runAction` llaman primero a `reportError`:
     si era pérdida de acceso no se muestra además el toast genérico.
   - Se eliminó la rama `room:kicked` del modal `forcedExit` (unifica el kick con el resto).
     El modal queda **solo** para `room:closed`.

4. **Mobile** (`mobile/pages/rooms/RoomDetail.jsx`)
   - Mismo guard. Muestra `showRoomAccessLost(reason)` y, solo si la pantalla sigue montada
     y enfocada (`useIsFocused` + refs), hace
     `navigation.reset({ index: 0, routes: [{ name: "Main", params: { screen: "Rooms" } }] })`,
     que deja el listado como única ruta (atrás no vuelve a la sala).
   - Misma unificación: el modal `forcedExit` queda solo para `room:closed`.

5. **Contrato y docs**
   - `docs/ESPECIFICACIONES-BACKEND.md`: `ROOM_ACCESS_LOST`, `reason`, `room:expelled`,
     `ROOM_EXPULSION_MARKER_TTL_MS` y corrección de la fila de `room:kicked` (va al canal
     `user:<id>`, a todos los sockets del usuario).
   - `Backend/.env.example`: `ROOM_EXPULSION_MARKER_TTL_MS`.
   - `mobile/README.md`: la navegación real es React Navigation (`mobile/App.jsx` +
     `mobile/navigation/MainTabs.jsx`), no Expo Router.

## Decisiones

- **Un solo mecanismo para toda pérdida de acceso.** El kick manual deja de abrir un modal:
  pasa por el mismo toast + redirección. El modal sobrevive solo para `room:closed`, que es
  un cierre, no una expulsión.
- **Filtro por `roomId`.** Un `room:kicked` de otra sala ya no afecta a la sala abierta
  (bug previo: el listener no miraba el payload).
- **Siempre se redirige, nunca se reintenta.** No hay reingreso automático: si el usuario
  quiere volver, entra por el listado o con el código.
- **`403` sin `code` no redirigen.** Contraseña incorrecta en `/join` o una acción exclusiva
  del anfitrión muestran su error normal. `not_member` (nunca fue miembro, p. ej. entrada por
  URL directa) sí redirige, con el copy genérico.
- **El motivo es best-effort.** `not_member` es el fallback válido; el flujo no depende de
  acertar el motivo.

## Deuda y límites conocidos

- **El evento en vivo casi nunca llega, por diseño.** El job solo expulsa invitados sin
  sockets; el cliente se entera al reconectar (`join-room` → `ROOM_ACCESS_LOST`) o al
  recargar (`403`). `room:expelled` cubre el caso en que el socket siga vivo (otra instancia
  del backend).
- **El marcador es estado del proceso.** Se pierde al reiniciar: después de un reinicio el
  motivo cae a `not_member`. No se persiste a propósito (es solo copy, no autorización).
- **Dependencia de un backend Node persistente.** Presencia, sockets, playback y marcadores
  viven en memoria; en serverless no hay continuidad ni reconexión confiable.
- **Mobile usa React Navigation, no Expo Router.** `mobile/README.md` y `mobile/AGENTS.md`
  decían lo contrario; se corrigió solo el README y manda el código (`AGENTS.md` regla de
  precedencia). El equivalente a `replace` es `navigation.reset`.
- **Sin tests automatizados** en esta entrega, por pedido explícito. La validación fue
  manual con dos sesiones y una sala descartable.
