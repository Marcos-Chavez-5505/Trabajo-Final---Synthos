# @synthos/shared — Documentation

Paquete de codigo compartido entre web y mobile. **Sin DOM, sin CSS, sin router**. Exporta codigo fuente desde `src/index.js`. Útil como dependencia tanto del `frontend/` como del `mobile/`.

## Propósito

Provee lógica de negocio centralizada, services, hooks, contexts, tokens y utilidades que ambos consumidores (web y mobile) usan sin dependencias de plataforma. Garantiza una sola fuente de verdad para tokens, convenciones y adaptadores.

## Estructura Principal (`src/`)

```text
src/
├── context/          # AuthContext, PlayerContext, NotificationsContext
├── features/         # Hooks por dominio (useHomeSongs, useRoomsList, useFollow, etc.)
├── hooks/            # useAuth, useDebounce, useFavorites, usePlayer, usePlayerTime, useRecommendation, useSongsSearch, useSearchPeople, useSearchAlbums, useLogin, useRegister, useArtists, useArtistDetail, usePlaylistList, useSongPlaylists, useMyRooms, useRoomPlayback, useFollow, useNotifications
├── icons/            # Catálogo generado de íconos (exporta desde .svg a JS)
├── services/         # api.js, albumsService.js, authService.js, artistsService.js, notificationsService.js, playlistsService.js, recommendationService.js, roomsService.js, socketService.js, songsService.js, usersService.js
├── tokens/           # tokens.js — literales de color/tipografía/elevación
├── utils/            # mapError.js, formatTime.js, pageRange.js, sidebarMotion.js
└── index.js          # Punto de entrada — todos los exports principales
```

## Restricciones Importantes

1. **No importa de `frontend/` ni de `mobile/`** — garantido por lint de `shared/` (`no-restricted-imports`).
2. **`react` es `peerDependency`** — cada consumidor provee su propia versión.
3. **Sin DOM, sin CSS, sin router** — este paquete es puro JavaScript/TypeScript sin dependencias de navegador o React Native.

## Scripts disponibles

| Script | Descripcion |
|---|---|
| `generate:tokens` | Regenera `frontend/src/styles/tokens.css` desde `shared/src/tokens/tokens.js` |
| `generate:icons` | Regenera `shared/src/icons/icons.js` desde `shared/assets/icons/*.svg` |
| `check:icons` | Falla si el catalogo de iconos no coincide con los `.svg` (para CI) |
| `lint` | ESLint sobre todo el paquete |

## Dependencias

- **Runtime**: `socket.io-client ^4.8.4` (para comunicación en tiempo real)
- **Peer**: `react ^19.3.0` (cada consumidor la provee)
- **Dev**: `eslint ^9.39.5`

## Tokens de Diseño

- Los literales (hex, `px` de fuente, `box-shadow`) viven solo en `src/tokens/tokens.js`.
- Se derivan con `var(--ds-*)` en:
  - `frontend/src/styles/utilities.css` (clases `.Wall`, `.Fucsia`, `.TextRegluar`…)
  - `frontend/src/styles/base.css` (resets)
  - `frontend/src/index.css` (puente semántico shadcn)
- **Nunca** escribir un hex, un `px` de fuente o un `box-shadow` en otro archivo CSS ni en estilos inline de un componente.

## Iconos

- **Fuente única editable**: `shared/assets/icons/*.svg` (siempre `<svg>`, `<path>`, `<circle>`, o `<g clip-path>` si cubre todo viewBox).
- **Nunca** usar librerías de íconos ni el sufijo `?react`.
- **Web**: importar como URL: `@synthos/shared/assets/icons/x.svg` (sin sufijo).
- **Mobile**: dibujar desde catálogo `shared/src/icons/icons.js` con `react-native-svg`, contrato `<Icon size color />`.
- Después de agregar/editar un SVG: correr `npm run generate:icons -w shared` y verificar con `npm run check:icons -w shared`.

## Adaptadores (consumo por plataforma)

| Característica | Web (frontend/) | Mobile (mobile/) |
|---|---|---|
| **Storage token** | `localStorage` (wrap) | `expo-secure-store` |
| **Config API** | `VITE_API_URL` | `EXPO_PUBLIC_API_URL` |
| **Audio motor** | `HTMLAudioElement` | `expo-audio` |
| **Iconos** | URL desde `@synthos/shared/assets/icons/` | Catálogo `shared/src/icons/icons.js` |
| **Archivos** | `File` (input) | `{ uri, name, type }` (RN) |

## Equipos / Consumidores

Este paquete es utilizado por:

- **`frontend/`**: Web desktop + mobile web — usa tokens, hooks, services, context.
- **`mobile/`**: App Expo — usa hooks, services, context, íconos del catálogo, motor de audio adaptado.

## Referencias Cruzadas

- `docs/agents/estilos-e-iconos.md` — reglas detalladas de tokens e íconos.
- `docs/agents/monorepo-y-adaptadores.md` — guía completa de adaptadores web/mobile.
- `docs/agents/convenciones-nombres-api.md` — convención de nombres de services y métodos.
- `Frontend/README.md` — detalles del frontend.
- `mobile/README.md` — detalles de la app mobile.