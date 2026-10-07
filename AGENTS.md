
# AGENTS.md — Contexto para agentes IA

Este archivo es la fuente de verdad para cualquier agente IA (Claude Code, Copilot, etc.) que trabaje en este repo. Léelo antes de generar código.

## 1. Proyecto

App de música social. Web (desktop) + APK instalable (mobile), mismo codebase.

**Stack:** React + Tailwind CSS + Vite. Empaquetado mobile: Capacitor (build web envuelto, sin lógica nativa separada).

**Conceptos clave del dominio:**

- No existe "Grupos". Fue reemplazado por **Salas** (`rooms`): espacios de escucha compartida, con admin, miembros, votación para saltar canción, públicas/privadas.
- Reproducción, playlists, favoritos, seguir personas, recomendaciones, chat en salas, búsqueda (canciones/personas/salas).

## 2. Estructura de carpetas (FrontEnd)

```
src/
├── components/
│   ├── ui/                    # botón, input, avatar, badge — atómicos, sin lógica de negocio
│   ├── layout/
│   │   ├── AppLayout.jsx      # decide Sidebar (desktop) vs BottomNav (mobile) via useBreakpoint
│   │   ├── Sidebar.jsx        # desktop: Home, Populares, Mi Colección, Mis Salas, Mis Playlists
│   │   ├── BottomNav.jsx      # mobile: Home, Salas, Buscar, Playlists
│   │   ├── TopBar.jsx         # flechas navegación + search
│   │   └── MiniPlayerBar.jsx  # barra reproducción mobile (encima de BottomNav)
│   ├── player/
│   │   ├── PlayerBar.jsx      # reproductor completo desktop
│   │   ├── PlayerControls.jsx # play/pause/skip/shuffle/repeat
│   │   └── ProgressBar.jsx
│   ├── cards/
│   │   ├── MediaCard.jsx      # tarjeta Título/Artista/Label (usado en Home y Salas)
│   │   ├── SectionCarousel.jsx
│   │   └── RoomListItem.jsx   # ítem de sala en sidebar/listas (reemplaza a "grupo")
│   └── chat/
│       ├── ChatList.jsx
│       ├── ChatWindow.jsx     # chat dentro de una sala
│       └── MessageBubble.jsx
├── features/                  # lógica de negocio por dominio, un folder = una feature
│   ├── home/
│   │   ├── HomeDesktop.jsx
│   │   └── HomeMobile.jsx
│   ├── auth/                  # registro, login, logout
│   ├── profile/                # editar perfil, ver perfil público, recomendaciones recibidas
│   ├── playlists/               # CRUD playlists, favoritos, playlists colaborativas
│   ├── rooms/                  # crear/administrar sala, votar skip, ranking por calificación, buscar salas
│   ├── search/                  # buscar canciones, personas, salas
│   └── social/                  # seguir/dejar de seguir, calificar anfitrión
├── hooks/
│   ├── useBreakpoint.js
│   ├── usePlayer.js
│   └── useAuth.js
├── context/
│   ├── PlayerContext.jsx      # estado global de reproducción
│   └── AuthContext.jsx
├── services/                   # una función = una llamada API, ver convención abajo
│   ├── api.js                  # instancia base (fetch/axios), interceptores auth
│   ├── authService.js
│   ├── songsService.js
│   ├── playlistsService.js
│   ├── roomsService.js
│   ├── usersService.js
│   └── recommendationsService.js
├── mocks/                      # datos fake por dominio, mientras no hay backend
│   ├── users.js
│   └── songs.js                # (agregar uno por dominio según haga falta)
├── routes/
│   └── AppRoutes.jsx
├── styles/                     # design system (única fuente de verdad de los valores)
│   ├── tokens.css              #   :root con TODOS los literales (color/tipografía/elevación)
│   ├── utilities.css           #   clases .Wall/.Fucsia/.TextRegluar… derivadas con var()
│   └── base.css                #   resets, derivados con var()
├── index.css                   # entrypoint de Tailwind (convención Vite) + puente semántico de shadcn
└── App.jsx
```

La documentación del proyecto vive en `docs/` (raíz del repo):

```
docs/
├── ESTRUCTURA.md                # onboarding: dónde está cada cosa y qué responsabilidad tiene
├── PENDIENTES.md                # estado de migración a la API real y pendientes
├── REQUERIMIENTOS-BACKEND.md    # requisitos por historia de usuario y su estado
├── ESPECIFICACIONES-BACKEND.md  # contratos de la API con ejemplos de curl
└── plan/                        # planes de sprint en formato agente, uno por entrega
    ├── sprint-1-plan.md
    └── sprint-2-plan.md
```

## 3. Convención de nombres

**Componentes:** `PascalCase.jsx`. Un componente = un archivo. Sin lógica de fetch dentro de `components/`; eso vive en `features/` o `services/`.

**Hooks:** `useNombre.js`, camelCase, prefijo `use`.

**Contexts:** `NombreContext.jsx`, PascalCase + sufijo `Context`.

**Services:** `dominioService.js`, camelCase + sufijo `Service`. Un service por recurso de dominio (no por endpoint suelto).

**Métodos dentro de un service:** patrón `verbo + Recurso`:

| Verbo                     | Uso                                          |
| ------------------------- | -------------------------------------------- |
| `get`                   | obtener uno por id                           |
| `list`                  | obtener colección (con filtros/paginación) |
| `create`                | crear                                        |
| `update`                | editar                                       |
| `remove`                | eliminar                                     |
| `join` / `leave`      | entrar/salir de sala                         |
| `vote`                  | votar (ej. skip)                             |
| `follow` / `unfollow` | seguir/dejar de seguir                       |

Ejemplos: `roomsService.js` → `listRooms()`, `getRoomById(id)`, `createRoom(data)`, `joinRoom(id, password?)`, `voteSkip(roomId)`.

**Rutas API (REST, backend):** base `/api`, recursos en plural, minúsculas, sin verbos:

```
/api/songs
/api/songs/:id
/api/playlists
/api/playlists/:id/songs
/api/rooms
/api/rooms/:id/members
/api/rooms/:id/vote-skip
/api/users
/api/users/:id/follow
/api/recommendations
```

**Estado global:** un Context por dominio transversal (Player, Auth). Estado de feature específica queda local a esa feature (useState/useReducer dentro de `features/x`).

## 4. Reglas para agentes IA

1. **No reintroducir "Grupos".** El concepto correcto es `rooms` / "Salas" en toda la app (variables, componentes, endpoints, copy en español = "Sala").
2. Reutilizar `MediaCard` y `SectionCarousel` en toda vista tipo grid — no crear variantes ad-hoc por pantalla.
3. Un solo `PlayerContext` global. `PlayerBar` (desktop) y `MiniPlayerBar` (mobile) son solo presentación, consumen el mismo estado.
4. Breakpoints Tailwind (`md:`, `lg:`) para alternar layouts desktop/mobile — no duplicar componentes por CSS cuando alcanza con clases responsive. Sí duplicar cuando la interacción es distinta (Sidebar vs BottomNav).
5. Toda llamada a red pasa por `services/`, nunca `fetch` directo dentro de un componente.
6. `mocks/` solo es consumido por su `xService.js` correspondiente (ej. `mocks/users.js` → `authService.js`/`usersService.js`), nunca directo desde componentes o features. Al migrar a backend real, solo se edita el contenido de `services/`; nada fuera de esa carpeta cambia.
7. Nuevo archivo de servicio → agregar su convención de nombres a este documento.
8. Antes de generar una feature nueva, revisar si ya existe folder en `features/` correspondiente.
9. `docs/plan/` (en la raíz del repo) contiene los planes de sprint en formato agente (autocontenidos). Nuevo sprint → nuevo archivo ahí, no sobrescribir los anteriores.
10. **Íconos: siempre desde `src/assets/*.svg`** (set de diseño propio), nunca de librerías de íconos. Se importan como **URL** (sin sufijo) y se usan con `<img src={...} alt="" aria-hidden="true" className="h-5 w-5" />`, dimensionados con utilidades Tailwind. **No** usar el sufijo `?react`: `@vitejs/plugin-react` no lo transforma en este proyecto, el import queda como string `data:image/svg+xml` y al renderizarlo como componente (`<Icon />`) revienta con `InvalidCharacterError: The tag name provided ('data:...')`. Los SVG traen `#F4F0F9` hardcodeado (= token `Lighter`), así que no se recolorean: para estado activo, jugar con el fondo (`Fucsia`/`Volume`) del botón, no con el color del ícono. Usar `<img>` con `alt` real solo para contenido (fotos, carátulas, avatares).
11. **Tokens: los literales viven solo en `src/styles/tokens.css`.** `styles/utilities.css` (clases `.Wall`, `.Fucsia`, `.TextRegluar`…) y `styles/base.css` (resets) se derivan con `var(--ds-*)`, y el puente semántico de shadcn en `src/index.css` (`:root` con `--background`, `--primary`, `--sidebar*`… y el `@theme inline`) también: **nunca** escribir un hex, un `px` de fuente o un `box-shadow` en otro archivo CSS ni en estilos inline de un componente. Para un color nuevo: primero el token en `tokens.css`, después su clase (si corresponde al design system) o su mapeo en el `:root` de `index.css` (si es una utilidad semántica de shadcn que lo necesita). Las clases del design system viven en `@layer components`, así que una utilidad Tailwind las sobrescribe (`className="Wall bg-red-500"`). ⚠️ `components.json` apunta `tailwind.css` a `src/index.css`: el CLI de shadcn reinyecta ahí su propio `:root` neutral, que al ir después en la cascada pisa el design system — si se corre `npx shadcn add`, hay que revisar y volver a dejar el bloque en `var(--ds-*)`.
12. **Git: no subir commits ni crear ramas sin autorización previa.** No ejecutar `git push` (ni `--force`/`--force-with-lease`, ni tags), **no crear ramas o tags**, no abrir PRs, y no hacer `reset --hard`/`rebase` sobre ramas ya publicadas, salvo que el usuario lo pida o lo autorice explícitamente en el mensaje. Sí se pueden hacer lecturas (`status`, `diff`, `log`, `show`) y commits locales. Ante la duda, **preguntar antes**: publicar afecta a otras personas y no se improvisa.

### 12.1 Criterio para ramas desprendidas de `dev`

Una vez que el usuario autoriza, cada cambio viaja en su propia rama saliendo de `dev`. Reglas:

- **Origen:** siempre `dev`, nunca desde otra rama de trabajo ni desde `main`. `dev` queda como rama de integración y no se commitea trabajo sin terminar.
- **Prefijo por tipo:** `feat/` funcionalidad nueva, `fix/` corrección de algo roto, `docs/` solo documentación o archivos `.md`. El prefijo va en el nombre de la rama, en minúsculas y con guiones.
- **Un cambio por rama.** Si en una misma tanda hay cosas de dominios distintos (por ejemplo una feature y una corrección de `AGENTS.md`), son ramas separadas, no un commit mixto.
- **Commits en español**, con el estilo de la regla 12 y cuerpo que explique el porqué, no el qué. Mensaje en imperativo, primera línea corta.
- **Nada ajeno por accidente.** Revisar `git status` antes de `git add` y stagear con rutas explícitas archivo por archivo, nunca con `git add .` ni `git add -A`. Archivo frecuentemente no deseado: el `package-lock.json` de la raíz (es un artefacto vacío, sin `package.json` que lo justifique; los locks reales viven en `Backend/` y `Frontend/`).
- **Verificar antes de pushear:** correr el lint y el build de `Frontend` (o el test que aplique). Recién con eso en verde se hace `git push -u origin <rama>`.
- **El PR lo abre el usuario.** El agente pushea la rama y pasa el link que devuelve GitHub (`.../pull/new/<rama>`), sin abrirlo.
- Al terminar, volver a `dev` para que el repo quede limpio y listo para el siguiente cambio.

## 5. Pendiente / decisiones abiertas

- Definir librería HTTP (axios vs fetch nativo) en `services/api.js`.
- Definir manejo de WebSockets para chat en salas y sincronización de reproducción (sugerido: `services/socketService.js`).
- Definir gestor de estado global si Context queda insuficiente (ej. Zustand).
