Cuándo leer este documento: necesitas saber qué doc de `docs/` abrir, qué falta o está abierto (chat en salas, estado global), o cómo afecta el despliegue (WebSocket, Vercel).
Origen: AGENTS.md original, bloque de documentación y §5. Posible solapamiento con `docs/ESTRUCTURA.md` §7 (índice de docs).

# Índice de `docs/` y pendientes

## Índice de documentación

La documentación del proyecto vive en `docs/` (raíz del repo). **No leer todos**: elegir el documento según la pregunta y abrir solo ese (ahorra tokens).

| Pregunta / necesidad | Documento y dónde mirar |
| --- | --- |
| ¿Dónde vive un archivo, cómo se estructura el repo, convenciones de carpetas o trampas conocidas? | `docs/ESTRUCTURA.md` — onboarding. §5 catálogo de endpoints (resumen), §6 convenciones y trampas, §7 índice de los demás docs |
| ¿Cómo está el código **hoy**? (stack, endpoints vigentes, services, estado de features, deudas) | `docs/CONTEXT.md` — snapshot listo para inyectar a agentes; §3 backend, §4 frontend, §7 deudas |
| ¿Qué **falta**, qué está migrado, qué decisión está abierta o qué se verificó contra la base real? | `docs/PENDIENTES.md` — backlog vivo numerado por tema (§5 conexión a la API con su sub-numeración) |
| ¿Cuál es el **contrato** de un endpoint (request/response/errores/`curl`)? | `docs/ESPECIFICACIONES-BACKEND.md` — **fuente canónica de contratos**: §1–5 canciones, §6 auth, §7 usuarios/follow, §8 favoritos, §9 playlists, §10 salas |
| ¿Está implementado/verificado un requerimiento? ¿qué bloquea a qué? ¿qué sigue? | `docs/REQUERIMIENTOS-BACKEND.md` — casillas con evidencia de verificación, decisiones D1–D11, §11 orden de incorporación, §12 trazabilidad TS |
| ¿Cómo se implementó o qué se decidió en un sprint pasado? | `docs/plan/sprint-1-plan.md`, `sprint-2-plan.md` — históricos autocontenidos (regla 9: no sobrescribir) |
| ¿Cómo implementar notificaciones (modelo, REST, WebSocket) y llevarlas a mobile? | `docs/NOTIFICACIONES-BACKEND.md` — guía de backend con modelo Prisma, eventos y adaptación a mobile |

Precedencia en caso de conflicto: `AGENTS.md` (convenciones) → `ESPECIFICACIONES-BACKEND.md` (contratos) → el resto. Si un doc contradice el código, manda el código y actualizar el doc.

## Pendiente / decisiones abiertas

- **Chat en salas**: la sincronización de reproducción ya usa WebSocket (`services/socketService.js` + Socket.IO), pero el **chat todavía no existe**: no hay ni tabla `room_message` ni eventos que lo transmitan.
- Definir gestor de estado global si Context queda insuficiente (ej. Zustand).

> **WebSockets y despliegue:** la sincronización de salas exige un **backend Node persistente**, porque el estado de reproducción y los votos viven en memoria del proceso (se pierden al reiniciar) y el handshake de Socket.IO no se sostiene en una función serverless. Hoy el backend es local, así que va. Si alguna vez se despliega en Vercel u otro serverless, hay que migrar la sincronización a polling (`GET /api/rooms/:id/playback` cada 3–5 s) o a un servicio externo tipo Ably/Pusher.