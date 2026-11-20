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

Las salas usan además las variables `ROOM_*` (gracia de presencia, pausa por anfitriona
ausente, expulsión por inactividad, TTL de géneros y debounce de tarjetas). Están
documentadas con sus defaults en `.env.example`.

## Docker

El backend incluye `docker-compose.yml` para levantar la base de datos y el servidor juntos:

```bash
docker-compose up -d
```

## Base de datos y migraciones

El proyecto usa Prisma **7.10** con migraciones versionadas en `prisma/migrations/`. La `shadow database`
se declara en `datasource.shadowDatabaseUrl` de `prisma.config.ts`; esta versión ya no acepta
`--shadow-database-url` ni `--to-schema-datamodel` en `prisma migrate diff`.

**Base nueva** (solo migraciones, sin datos):

```bash
cd Backend
docker compose up -d
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

**Base existente que ya tiene `room_kicked`** (creada a mano o con `db push`). La migración
`20261120095925_add_room_kicked` no es idempotente: hay que marcarla como aplicada antes de seguir.

```bash
cd Backend
npx prisma generate
npx prisma migrate resolve --applied 20261120095925_add_room_kicked
npx prisma migrate deploy
```

**Base existente sin `room_kicked`**:

```bash
cd Backend
npx prisma generate
npx prisma migrate deploy
```

> [!WARNING]
> No usar `prisma migrate dev` sobre bases con tablas creadas a mano. Detecta el desfase entre el
> schema y la base y propone un reset que **borra los datos**. `migrate dev` queda solo para crear
> migraciones nuevas en una base de desarrollo ya sincronizada. Para aplicar migraciones usar
> `migrate deploy`; para registrar a mano una migración ya presente, `migrate resolve --applied`.

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