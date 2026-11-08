Cuándo leer este documento: vas a crear, mover o ubicar archivos en `Frontend/src/`, o tocar layout, cards, páginas, features, hooks o contexts.
Origen: AGENTS.md original §1 y §2. Posible solapamiento con `docs/ESTRUCTURA.md` (onboarding).

# Arquitectura del frontend

## Funcionalidades del dominio

- Reproducción, playlists, favoritos, seguir personas, recomendaciones, chat en salas, búsqueda (canciones/personas/salas).
- Salas (`rooms`): espacios de escucha compartida, con admin, miembros, votación para saltar canción, públicas/privadas.

## Estructura de carpetas (Frontend)

```
src/
├── main.jsx
├── app/                       # shell de la app; puede componer features
│   ├── App.jsx
│   └── layout/                # AppLayout, Sidebar, SidebarAutoCollapse, TopBar, BottomNav
├── routes/                    # AppRoutes, RequireAuth, PublicOnly
├── pages/                     # una página por ruta, sufijo *Page
│   ├── landing/ auth/ home/ profile/ playlists/ rooms/
│   ├── catalog/ search/ notifications/ mood/
│   └── dev/                   # ComponentsPage + ejemplos del design system
├── features/                  # UI y lógica de un dominio
│   ├── home/                  # components/
│   ├── player/                # components/, hooks/
│   ├── playlists/             # components/, index.js (API pública)
│   ├── rooms/                 # components/, lib/
│   ├── search/                # components/, hooks/
│   ├── social/                # components/, index.js (API pública)
│   ├── profile/               # components/
│   ├── notifications/         # components/, lib/
│   ├── recommendation/        # components/
│   └── mood/                  # components/, lib/
├── components/                # UI transversal; no importa features/
│   ├── ui/                    # primitivas shadcn/base-ui + Avatar, LoadingScreen
│   ├── cards/                 # MediaCard, MiniMediaCard, RoomCard, UserRow, ArtistCard
│   ├── actions/               # QueueActionButton, AddToQueueButton
│   ├── motion/                # combobox, SidebarAnimatedGroup
│   └── animate-ui/
├── hooks/                     # solo hooks transversales (useBreakpoint, use-mobile)
├── lib/                       # audioMotor, utils, toastMessages
│   ├── images/                # prepareImage
│   └── motion/                # sidebar.js, drag.js
├── styles/                    # design system (única fuente de verdad)
│   ├── tokens.css             #   :root con TODOS los literales (color/tipografía/elevación)
│   ├── utilities.css          #   clases .Wall/.Fucsia/.TextRegluar… derivadas con var()
│   └── base.css               #   resets, derivados con var()
├── index.css                  # entrypoint de Tailwind + puente semántico de shadcn
└── fonts/
```

La lógica de negocio compartida **no vive en `Frontend/`**: services, contexts, hooks de feature,
tokens e íconos están en `shared/src/` y se consumen desde `@synthos/shared` o sus subpaths de assets.

## Dirección de dependencias

```
pages      -> features, components, hooks, lib, shared
features   -> components, hooks, lib, shared
components -> components, hooks, lib, shared
app        -> features, components, hooks, lib, shared
shared     -> nada de Frontend/ ni mobile/
```

- Entre features solo se importa por el `index.js` público de la otra feature, nunca por un archivo interno.
- `components/` no importa de `features/` ni de `app/`.
- `features/` no importa de `app/`.

## Reglas que dependen de esta estructura

- Componentes sin lógica de fetch: eso vive en `shared/src/services/` y en los hooks de cada feature.
- Un `PlayerContext` global en `shared/`. Los componentes del player solo presentan.
- Reutilizar `MediaCard` y variantes (`MiniMediaCard`, `RoomCard`) en toda vista tipo grid.
- Páginas: `pages/<dominio>/<Nombre>Page.jsx`. No implementan reglas de dominio.
- Componentes de feature: `features/<dominio>/components/<Nombre>.jsx`.
- Hooks globales: `hooks/use<Nombre>.js`. Hooks de feature: `features/<dominio>/hooks/`.
- Helpers de UI: `lib/`. Contextos globales: `shared/src/context/`.
- Imports: `@/...` para cruzar carpetas; relativos solo entre hermanos.
- Antes de una feature nueva, revisar si ya existe su carpeta en `features/` y en `pages/`.
