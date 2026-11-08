# Synthos — Monorepo

Aplicacion de musica social con Web (desktop) y APK instalable (mobile), mismo codebase.

## Estructura del Monorepo

```text
/
├── backend/     # API Express + Prisma + PostgreSQL + Socket.IO
├── frontend/    # Web UI: React + Tailwind + Vite
├── mobile/      # App Expo (React Native + Expo Router)
└── shared/      # @synthos/shared — codigo puro, sin DOM, sin CSS, sin router
```

## Comandos desde la raiz

| Comando | Descripcion |
|---|---|
| `npm run dev -w frontend` | Servidor de desarrollo Vite |
| `npm run build -w frontend` | Build de produccion |
| `npm run lint -w frontend` | Lint del frontend (oxlint) |
| `npm run lint -w shared` | Lint de shared/ (ESLint, guardas DOM/imports) |
| `npm run generate:tokens -w shared` | Regenera `frontend/src/styles/tokens.css` desde tokens.js |
| `npm run generate:icons -w shared` | Regenera iconos desde `shared/assets/icons/*.svg` |
| `npm run check:icons -w shared` | Falla si el catalogo de iconos está desactualizado |

## Enlaces a documentación por paquete

- [Backend](./Backend/README.md) — API, endpoints, base de datos
- [Frontend](./Frontend/README.md) — UI, componentes, PlayerContext, estado
- [Mobile](./mobile/README.md) — Expo, navegacion, audio motor
- [Shared](./shared/README.md) — codigo compartido, tokens, iconos, restricciones

## Índice de documentación técnica

Consultar `docs/agents/` para convenciones, nombres de API, reglas de git y comportamiento del agente.

---

Verificación mínima: lint y build de `Frontend` (ver `docs/agents/git-ramas-y-pr.md`).