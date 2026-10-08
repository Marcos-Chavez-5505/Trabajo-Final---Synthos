
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
│   │   ├── SidebarAutoCollapse.jsx # colapsa/expande el sidebar al cruzar 1280px (no pisa el trigger manual)
│   │   ├── BottomNav.jsx      # mobile: Home, Salas, Buscar, Playlists
│   │   ├── TopBar.jsx         # búsqueda + botón del sidebar (trigger de shadcn); flechas navegación ocultas
│   │   └── MiniPlayerBar.jsx  # barra reproducción mobile (encima de BottomNav)
│   ├── player/
│   │   ├── PlayerBar.jsx      # reproductor completo desktop
│   │   ├── PlayerControls.jsx # play/pause/skip/shuffle/repeat
│   │   └── ProgressBar.jsx
│   ├── cards/
│   │   ├── MediaCard.jsx      # tarjeta Título/Artista/Label (grids)
│   │   ├── MiniMediaCard.jsx  # variante compacta
│   │   ├── RoomCard.jsx       # tarjeta de sala (listado /salas)
│   │   └── UserRow.jsx        # fila de usuario (búsqueda y listas de seguidores)
├── features/                  # lógica de negocio por dominio, un folder = una feature
│   ├── home/
│   │   ├── HomeDesktop.jsx
│   │   └── HomeMobile.jsx
│   ├── auth/                  # registro, login, logout
│   ├── profile/               # editar perfil, ver perfil público
│   ├── playlists/             # CRUD playlists, favoritos, playlists colaborativas
│   ├── rooms/                 # listado de salas (crear/administrar/votar skip, pendientes)
│   ├── search/                # buscar canciones y personas
│   └── social/                # seguir/dejar de seguir
├── hooks/
│   ├── useAuth.js
│   ├── usePlayer.js
│   ├── useBreakpoint.js
│   ├── useFavorites.js
│   ├── useDebounce.js
│   └── use-mobile.ts          # hook de breakpoint mobile (primitiva de shadcn)
├── context/
│   ├── PlayerContext.jsx      # estado global de reproducción
│   └── AuthContext.jsx
├── services/                   # una función = una llamada API, ver convención abajo
│   ├── api.js                  # fetch nativo: helpers get/post/patch/put/del, token y handler de 401
│   ├── authService.js
│   ├── songsService.js
│   ├── playlistsService.js
│   ├── roomsService.js         # único que consume mocks hoy (USE_MOCK)
│   └── usersService.js
├── mocks/                      # datos fake; solo los importa su service. Hoy solo rooms.js (→ roomsService)
│   ├── playlists.js            # sin uso (playlists migró a la API)
│   ├── rooms.js                # en uso
│   ├── songs.js                # sin uso (pendiente de borrar)
│   └── users.js                # sin uso (auth/usuarios migraron a la API)
├── routes/
│   └── AppRoutes.jsx
├── styles/                     # design system (única fuente de verdad de los valores)
│   ├── tokens.css              #   :root con TODOS los literales (color/tipografía/elevación)
│   ├── utilities.css           #   clases .Wall/.Fucsia/.TextRegluar… derivadas con var()
│   └── base.css                #   resets, derivados con var()
├── index.css                   # entrypoint de Tailwind (convención Vite) + puente semántico de shadcn
└── App.jsx
```

La documentación del proyecto vive en `docs/` (raíz del repo). **No leer todos**: elegir el documento según la pregunta y abrir solo ese (ahorra tokens):

| Pregunta / necesidad | Documento y dónde mirar |
| --- | --- |
| ¿Dónde vive un archivo, cómo se estructura el repo, convenciones de carpetas o trampas conocidas? | `docs/ESTRUCTURA.md` — onboarding. §5 catálogo de endpoints (resumen), §6 convenciones y trampas, §7 índice de los demás docs |
| ¿Cómo está el código **hoy**? (stack, endpoints vigentes, services, estado de features, deudas) | `docs/CONTEXT.md` — snapshot listo para inyectar a agentes; §3 backend, §4 frontend, §7 deudas |
| ¿Qué **falta**, qué está migrado, qué decisión está abierta o qué se verificó contra la base real? | `docs/PENDIENTES.md` — backlog vivo numerado por tema (§5 conexión a la API con su sub-numeración) |
| ¿Cuál es el **contrato** de un endpoint (request/response/errores/`curl`)? | `docs/ESPECIFICACIONES-BACKEND.md` — **fuente canónica de contratos**: §1–5 canciones, §6 auth, §7 usuarios/follow, §8 favoritos, §9 playlists, §10 salas |
| ¿Está implementado/verificado un requerimiento? ¿qué bloquea a qué? ¿qué sigue? | `docs/REQUERIMIENTOS-BACKEND.md` — casillas con evidencia de verificación, decisiones D1–D11, §11 orden de incorporación, §12 trazabilidad TS |
| ¿Cómo se implementó o qué se decidió en un sprint pasado? | `docs/plan/sprint-1-plan.md`, `sprint-2-plan.md` — históricos autocontenidos (regla 9: no sobrescribir) |

Precedencia en caso de conflicto: `AGENTS.md` (convenciones) → `ESPECIFICACIONES-BACKEND.md` (contratos) → el resto. Si un doc contradice el código, manda el código y actualizar el doc.

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
2. Reutilizar `MediaCard` y sus variantes (`MiniMediaCard`, `RoomCard`) en toda vista tipo grid — no crear variantes ad-hoc por pantalla.
3. Un solo `PlayerContext` global. `PlayerBar` (desktop) y `MiniPlayerBar` (mobile) son solo presentación, consumen el mismo estado.
4. Breakpoints Tailwind (`md:`, `lg:`) para alternar layouts desktop/mobile — no duplicar componentes por CSS cuando alcanza con clases responsive. Sí duplicar cuando la interacción es distinta (Sidebar vs BottomNav).
5. Toda llamada a red pasa por `services/`, nunca `fetch` directo dentro de un componente.
6. `mocks/` solo es consumido por su `xService.js` correspondiente (ej. `mocks/rooms.js` → `roomsService.js`), nunca directo desde componentes o features. Al migrar a backend real, solo se edita el contenido de `services/`; nada fuera de esa carpeta cambia.
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
- **Descripción de la rama.** Junto con el link del PR, el agente entrega un resumen breve con los puntos más importantes del cambio. Ese resumen se vuelca en `.github/PULL_REQUEST_TEMPLATE.md`, que GitHub carga automáticamente al abrir un PR contra `dev` o `main`. Los puntos se ordenan con alertas de Markdown (`> [!NOTE]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!TIP]`), no como texto plano suelto: en qué consiste el cambio, decisiones relevantes, riesgos y cómo verificarlo.
- Al terminar, volver a `dev` para que el repo quede limpio y listo para el siguiente cambio.

## 5. Pendiente / decisiones abiertas

- Definir manejo de WebSockets para chat en salas y sincronización de reproducción (sugerido: `services/socketService.js`).
- Definir gestor de estado global si Context queda insuficiente (ej. Zustand).
