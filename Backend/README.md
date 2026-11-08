# Backend — SYNTHOS

API REST para la aplicacion de musica social. Construido con Express, Prisma y PostgreSQL, con sincronizacion en tiempo real mediante Socket.IO.

## Stack Tecnologico

- **Runtime**: Node.js (CommonJS)
- **Framework**: Express
- **ORM/DB**: Prisma + PostgreSQL
- **Real-time**: Socket.IO (server + client)
- **Imaging**: @imagekit/nodejs
- **Authentication**: JWT (jsonwebtoken), bcrypt, bcryptjs

## Endpoints API Principales

| Recurso | Prefijo |
|---|---|
| Canciones | /api/songs |
| Canciones (id) | /api/songs/:id |
| Playlists | /api/playlists |
| Playlists (con canciones) | /api/playlists/:id/songs |
| Usuarios | /api/users |
| Usuarios (follow) | /api/users/:id/follow |
| Salas | /api/rooms |
| Salas (members) | /api/rooms/:id/members |
| Salas (vote-skip) | /api/rooms/:id/vote-skip |
| Auth | /api/auth |

Consultar `docs/ESPECIFICACIONES-BACKEND.md` para el contrato canonico (request/response/errores con curl).

## Variables de Entorno

Copiar `.env.example` a `.env` y completar:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
PORT=3000
NODE_ENV=development
```

## Docker

El backend incluye `docker-compose.yml` para levantar la base de datos y el servidor juntos:

```bash
docker-compose up -d
```

## Socket.IO

Sala sincronizada requiere backend Node persistente (estado en memoria). Handshake con JWT. Ver `services/socketService.js` en `shared/`.

## Scripts disponibles

| Script | Descripcion |
|---|---|
| `npm run dev` | Inicia con nodemon (NODE_ENV=development) |
| `npm run start` | Produccion con node |
| `npm run vercel-build` | `prisma generate` para despliegue |

## Notas

- El backend conserva su `package-lock.json` (fuera de workspaces).
- La sincronizacion de salas exige un **backend Node persistente**; el estado de reproduccion y votos vive en memoria del proceso.
- Si se despliega en Vercel u otro serverless, hay que migrar la sincronizacion a polling o a un servicio externo tipo Ably/Pusher.