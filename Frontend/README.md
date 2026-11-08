# Frontend — SYNTHOS

Interfaz web (desktop + mobile) para la aplicacion de musica social. Construido con React 19, Tailwind CSS y Vite.

## Comandos

| Comando | Descripcion |
|---|---|
| `npm run dev` | Servidor de desarrollo Vite |
| `npm run build` | Build de produccion |
| `npm run lint` | Lint del frontend (oxlint) |

## Estructura de Carpetas Clave

```text
src/
├── main.jsx
├── app/              # shell de la app (compone features)
│   ├── App.jsx
│   └── layout/       # AppLayout, Sidebar, BottomNav, TopBar, SidebarAutoCollapse
├── routes/           # AppRoutes, RequireAuth, PublicOnly
├── pages/            # una página por ruta, sufijo *Page
│   ├── landing/ auth/ home/ profile/ playlists/ rooms/ catalog/ search/ notifications/ mood/
│   └── dev/          # ComponentsPage y ejemplos del design system
├── features/         # UI y lógica de un dominio
│   ├── home/         # components/ (HomeDesktop, HomeSection)
│   ├── player/       # components/, hooks/
│   ├── playlists/    # components/, index.js (API pública)
│   ├── rooms/        # components/, lib/
│   ├── search/       # components/, hooks/
│   ├── social/       # components/, index.js (API pública)
│   ├── profile/      # components/
│   ├── notifications/# components/, lib/
│   ├── recommendation/ # components/
│   └── mood/         # components/, lib/
├── components/       # UI transversal (no importa features/)
│   ├── ui/           # botón, input, avatar, badge, primitivas
│   ├── cards/        # MediaCard, MiniMediaCard, RoomCard — reutilizar en todo grid
│   ├── actions/      # QueueActionButton, AddToQueueButton
│   ├── motion/       # combobox, SidebarAnimatedGroup
│   └── animate-ui/
├── hooks/            # solo hooks transversales (useBreakpoint, use-mobile)
├── lib/              # audioMotor, utils, toastMessages
│   ├── images/       # prepareImage
│   └── motion/       # sidebar.js, drag.js
├── styles/           # design system (única fuente de verdad)
│   ├── tokens.css    # :root con TODOS los literales (color/tipografía/elevación)
│   ├── utilities.css # clases .Wall/.Fucsia/.TextRegluar derivadas con var()
│   └── base.css      # resets, derivados con var()
├── index.css         # entrypoint Tailwind + puente semántico shadcn
└── fonts/
```

## PlayerContext Global

- **Un solo PlayerContext global** (en `@synthos/shared`) que maneja la reproducción.
- Los componentes del player (`features/player/`) **solo presentan** — consumen el mismo estado.
- Estado: `queue`, `index`, `isPlaying`, `currentTime`, `duration`, `shuffle`, `repeat`.
- `playSongs(songs, startIndex)`: punto de entrada para reproducir desde cards o playlists.
- El historial de saltos vive solo en el cliente; no sobrevive a un refresh.

## Servicios vs Componentes

- **Nunca fetch directo en un componente** — toda llamada a red va en `shared/src/services/`.
- Services siguen convención `verbo + Recurso` (ver `docs/agents/convenciones-nombres-api.md`):
  - `get`, `list`, `create`, `update`, `remove`, `join`, `leave`, `vote`, `follow`, `unfollow`

## Tokens e Iconos

- **Tokens**: hex, `px` de fuente y `box-shadow` viven solo en `src/styles/tokens.css`. El resto se deriva con `var(--ds-*)`.
- **Íconos**: solo desde `shared/assets/*.SVG`. Web los importa como URL desde `@synthos/shared/assets/icons/x.svg` (sin sufijo `?react`). Mobile del catálogo generado `shared/src/icons/icons.js`.
- Ejecutar `npm run generate:tokens -w shared` y `npm run generate:icons -w shared` después de cambios.

## Paquete compartido (@synthos/shared)

- Sin DOM, sin CSS, sin router.
- Exporta código fuente desde `src/index.js`.
- Restricción permanente: `shared/` no importa de `frontend/` ni de `mobile/`.
- Ver `shared/README.md` para más detalles.

## Lo que NO se hace

- No crear variantes ad-hoc por pantalla — reutilizar `MediaCard` y variantes (`MiniMediaCard`, `RoomCard`).
- No duplicar `PlayerContext` lógico — los componentes del player solo presentan.
- No usar `git add .` ni `git add -A` — stagear con rutas explícitas.