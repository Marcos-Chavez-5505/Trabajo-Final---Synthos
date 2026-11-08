# Análisis de estructura de `frontend/` y `shared/`

Revisé el árbol completo de `frontend/src` y `shared/src`, `AppRoutes`, los imports reales y los puntos donde se cruzan. No modifiqué ningún archivo. Esta es solo una propuesta de estructura.

## 1. Diagnóstico

La estructura actual no está mal por tener `features/`. El problema es que hoy “feature” significa tres cosas distintas: pantalla, componente y hook. Eso hace que no haya una frontera clara entre página, feature, componente compartido y lógica de `shared`.

1. **`pages/` no es la capa de páginas.**`frontend/src/pages/` solo contiene `Landing` y `Components`. Las 19 pantallas reales se importan desde `features/` en `AppRoutes.jsx`: `Home`, `Login`, `Register`, `ProfileView`, `ProfilePublic`, `Rooms`, `CreateRoom`, `RoomView`, `MoodScan`, `FollowList`, `Search`, `Playlists`, `PlaylistDetail`, `Albums`, `AlbumDetail`, `Artists`, `ArtistDetail`, `Populares` y `Notifications`. La capa de rutas existe, pero la de páginas no.
2. **`features/` mezcla pantalla, sección, modal, tarjeta, widget de sidebar y helper.**En la misma carpeta conviven cosas como `Home.jsx` o `RoomView.jsx` (páginas), `PlaylistTile.jsx` o `NotificationRow.jsx` (componentes), `MyRooms.jsx` y `MisPlaylists.jsx` (widgets del sidebar), `roomNotice.js` o `profileImage.js` (helpers). Además, `Playlists.jsx` define `PlaylistGrid` y `EmptyState` dentro del mismo archivo, y `PlaylistDetail.jsx` es una página con mucha lógica y estado. No hay forma rápida de saber si un archivo es una ruta o una pieza reutilizable.
3. **Los hooks tienen tres convenciones al mismo tiempo.**Están los hooks globales en `shared/src/hooks/`, los hooks de feature en `shared/src/features/**/use*.js` y un hook local dentro de `components/motion/combobox/use-active-option.ts`. Hay además nombres que no coinciden con el archivo: `useSongsSearch.jsx` exporta `useSongSearch`, `useHomeArtists.jsx` exporta `useNewArtists` y `useHomeAlbums.jsx` exporta `useLatestAlbums`. Varios `.jsx` no devuelven JSX. Y hay dos hooks de búsqueda de canciones con nombres casi invertidos: `useSongSearch` y `useSearchSongs`, con formas de retorno distintas.
4. **La API pública de `shared` es demasiado amplia y, a la vez, incompleta.**`shared/src/index.js` exporta todo con `export *`, pero `HomeDesktop` necesita importar por ruta interna `@synthos/shared/src/features/home/useHomeArtists.jsx` y `useHomeAlbums.jsx` porque no están en el barrel. Mobile tiene que hacer imports profundos de `tokens` e `icons` para no arrastrar `socket.io`. No hay `exports` map ni una frontera clara entre lo público y lo interno.
5. **`components/` no es una capa inferior real.**`components/layout/Sidebar.jsx` importa `MisPlaylists`, `CollabPlaylists`, `MyRooms` y `ProfileSummary` desde `features/`. `components/player/PlayerBar.jsx`, `MiniPlayerBar.jsx` y `ActionControls.jsx` importan `FavoriteButton` y `AddToPlaylistPanel` desde `features/playlists`. Así, `components` depende de `features` y `features` depende de `components`: la dirección de dependencias no está definida.
6. **Hay dependencias cruzadas entre features y constantes de web dentro de `shared`.**`features/playlists/PlaylistDetail.jsx` importa `UserSearch` de `features/search` y `prepareProfileImage` de `features/profile`. `shared` exporta `SIDEBAR_SPRING` y los `DRAG_*`/springs de `reorderConfig`, que son valores de animación de la UI web, no lógica de negocio. Además, `SIDEBAR_SPRING` está duplicado a mano en `PlayerControls.jsx` y `TransportControls.jsx`.
7. **Naming, extensiones e imports inconsistentes.**`Populares.jsx` convive con `features/popular`; `MisPlaylists.jsx` con `MyRooms.jsx`; `ProfileView` con `ProfilePublic`; `RoomView`, `MoodScan`, `HomeDesktop`. `RecommendationSection/RecommendationSection.jsx`, `RecommendSongModal/RecommendSongModal.jsx` y `SongSearchStep/SongSearchStep.jsx` repiten carpeta y archivo, mientras el resto son archivos planos. `pages/Landing/Landing.jsx` usa carpeta PascalCase y `pages/components/Components.jsx` usa minúscula. Se mezclan imports con alias `@/...` y relativos `../../...`. También hay código muerto o de demo dentro de producción: `notificationsMock.js` no se importa, `HomeMobile` no se usa y los `*-examples.jsx` de `components/ui` solo existen para la página `/components`.
8. **Los contextos tienen tres patrones distintos.**Auth usa `authContext.js` + `AuthContext.jsx` + `useAuth.js` en `hooks/`. Player usa `playerContext.js` + `PlayerContext.jsx` + `playerTimeContext.js` + hooks en `hooks/`. Notifications y Recommendation usan un solo archivo con el context, el provider y los hooks de acceso. No hay una regla única sobre dónde vive el contexto, dónde el provider y dónde el hook que lo consume.
9. **La consecuencia no es “demasiados archivos”, sino falta de dirección de dependencias.**
   Hoy no se puede responder rápido: ¿esto es una página o un componente?, ¿este hook es global o de feature?, ¿puedo importar esto desde acá?, ¿qué exporta realmente `@synthos/shared`? La estructura propuesta apunta a que esas preguntas tengan una sola respuesta.

## 2. Estructura propuesta

### 2.1 Idea central

Separar cuatro conceptos que hoy están mezclados:

- **Página**: entrada de una ruta. Compone, no implementa reglas de dominio.
- **Feature**: UI y lógica de un dominio concreto. Puede tener componentes, hooks y helpers propios.
- **Componente compartido**: UI reutilizable por varias features. No conoce features.
- **Shared**: lógica y datos compartidos entre web y mobile. No conoce DOM, CSS ni router.

La regla de dependencias sería:

```text
pages      -> features, components, hooks, lib, shared
features   -> components, hooks, lib, shared
components -> components, hooks, lib, shared
app        -> features, components, hooks, lib, shared
shared     -> nada de frontend/ ni mobile/
```

Entre features solo se permite importar por el `index.js` público de la otra feature, nunca por un archivo interno.

### 2.2 Frontend propuesto

```text
frontend/src/
├── main.jsx
├── app/
│   ├── App.jsx
│   └── layout/
│       ├── AppLayout.jsx
│       ├── Sidebar.jsx
│       ├── SidebarAnimatedGroup.jsx
│       ├── SidebarAutoCollapse.jsx
│       ├── TopBar.jsx
│       └── BottomNav.jsx
├── routes/
│   ├── AppRoutes.jsx
│   ├── RequireAuth.jsx
│   └── PublicOnly.jsx
├── pages/
│   ├── landing/LandingPage.jsx
│   ├── auth/LoginPage.jsx
│   ├── auth/RegisterPage.jsx
│   ├── home/HomePage.jsx
│   ├── profile/ProfilePage.jsx
│   ├── profile/PublicProfilePage.jsx
│   ├── profile/FollowListPage.jsx
│   ├── playlists/PlaylistsPage.jsx
│   ├── playlists/PlaylistDetailPage.jsx
│   ├── rooms/RoomsPage.jsx
│   ├── rooms/CreateRoomPage.jsx
│   ├── rooms/RoomPage.jsx
│   ├── catalog/AlbumsPage.jsx
│   ├── catalog/AlbumDetailPage.jsx
│   ├── catalog/ArtistsPage.jsx
│   ├── catalog/ArtistDetailPage.jsx
│   ├── catalog/PopularPage.jsx
│   ├── search/SearchPage.jsx
│   ├── notifications/NotificationsPage.jsx
│   ├── mood/MoodPage.jsx
│   └── dev/ComponentsPage.jsx
├── features/
│   ├── home/
│   │   └── components/
│   │       ├── HomeDesktop.jsx
│   │       ├── HomeMobile.jsx
│   │       └── HomeSection.jsx
│   ├── player/
│   │   ├── components/
│   │   │   ├── PlayerBar.jsx
│   │   │   ├── MiniPlayerBar.jsx
│   │   │   ├── ExpandedPlayer.jsx
│   │   │   ├── PlayerControls.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── TransportControls.jsx
│   │   │   ├── ActionControls.jsx
│   │   │   └── UpNext.jsx
│   │   └── hooks/usePlayerWebEffects.js
│   ├── playlists/
│   │   └── components/
│   │       ├── FavoriteButton.jsx
│   │       ├── AddToPlaylistPanel.jsx
│   │       ├── PlaylistTile.jsx
│   │       ├── PlaylistSongRow.jsx
│   │       ├── PlaylistCreateForm.jsx
│   │       ├── PlaylistInvitations.jsx
│   │       ├── PlaylistSidebarList.jsx
│   │       ├── MisPlaylists.jsx
│   │       └── CollabPlaylists.jsx
│   ├── rooms/
│   │   ├── components/
│   │   │   ├── JoinRoomDialog.jsx
│   │   │   ├── MyRooms.jsx
│   │   │   └── RoomSidebarList.jsx
│   │   └── lib/roomNotice.js
│   ├── search/
│   │   ├── components/
│   │   │   ├── SearchTabs.jsx
│   │   │   ├── SearchSongs.jsx
│   │   │   ├── SearchPeople.jsx
│   │   │   ├── SearchAlbums.jsx
│   │   │   ├── SearchPersonRow.jsx
│   │   │   ├── UserSearch.jsx
│   │   │   └── RecentSearchesCombobox.jsx
│   │   └── hooks/useRecentSearches.js
│   ├── social/
│   │   └── components/
│   │       ├── FollowButton.jsx
│   │       ├── FollowStats.jsx
│   │       └── HostRatingBadge.jsx
│   ├── profile/
│   │   └── components/
│   │       ├── ProfileEdit.jsx
│   │       └── ProfileSummary.jsx
│   ├── notifications/
│   │   ├── components/NotificationRow.jsx
│   │   └── lib/formatRelativeTime.js
│   ├── recommendation/
│   │   └── components/
│   │       ├── RecommendationSection.jsx
│   │       ├── RecommendSongModal.jsx
│   │       └── SongSearchStep.jsx
│   └── mood/
│       ├── components/
│       │   ├── MoodPicker.jsx
│       │   └── MoodResults.jsx
│       └── lib/moodDetection.js
├── components/
│   ├── ui/
│   ├── cards/
│   ├── feedback/
│   └── motion/
├── hooks/
│   ├── useBreakpoint.js
│   └── use-mobile.ts
├── lib/
│   ├── audioMotor.js
│   ├── expandOrigin.js
│   ├── ease.ts
│   ├── utils.ts
│   ├── toastMessages.js
│   ├── images/prepareImage.js
│   └── motion/
│       ├── sidebar.js
│       └── drag.js
├── styles/
└── index.css
```

Notas de esta estructura:

- `pages/` contiene **solo rutas**. `HomePage` decide qué layout de home mostrar; `HomeDesktop` y `HomeMobile` son componentes de la feature `home`.
- `components/layout` desaparece como capa genérica: el shell de la app pasa a `app/layout`, que sí puede componer features.
- `components/player` desaparece como carpeta compartida: el reproductor es una feature completa (`features/player`).
- `components/` queda para UI realmente transversal: `ui`, `cards`, `feedback`, `motion`.
- `components/home/HomeSection` y `components/RecommendationSection` no son compartidos: son de una feature y se mueven a `features/home` y `features/recommendation`.
- `lib/images/prepareImage.js` resuelve el uso cruzado actual entre `profile` y `playlists`.
- `components/ui` no contiene ejemplos ni helpers de aplicación; los ejemplos pasan a `pages/dev` o a una carpeta `dev/` fuera del design system.
- No se propone crear componentes nuevos. La componentización de páginas grandes como `PlaylistDetail` queda para otra etapa.

### 2.3 Shared propuesto

```text
shared/src/
├── api/
│   └── client.js
├── services/
│   ├── albumsService.js
│   ├── artistsService.js
│   ├── authService.js
│   ├── notificationsService.js
│   ├── playlistsService.js
│   ├── recommendationService.js
│   ├── roomsService.js
│   ├── socketService.js
│   ├── songsService.js
│   └── usersService.js
├── features/
│   ├── albums/hooks/useAlbums.js
│   ├── artists/hooks/
│   │   ├── useArtists.js
│   │   └── useArtistDetail.js
│   ├── auth/hooks/
│   │   ├── useLogin.js
│   │   └── useRegister.js
│   ├── home/hooks/
│   │   ├── useHomeSongs.js
│   │   ├── useHomeArtists.js
│   │   └── useHomeAlbums.js
│   ├── mood/hooks/useMoodSongs.js
│   ├── notifications/hooks/useNotifications.js
│   ├── playlists/
│   │   ├── hooks/
│   │   │   ├── usePlaylistList.js
│   │   │   ├── usePlaylistsPage.js
│   │   │   ├── useReorderSongs.js
│   │   │   └── useSongPlaylists.js
│   │   └── lib/
│   │       ├── playlistCover.js
│   │       └── reorderConfig.js
│   ├── popular/hooks/usePopularSongs.js
│   ├── profile/hooks/
│   │   ├── useProfileEdit.js
│   │   ├── useProfilePublic.js
│   │   └── useProfileView.js
│   ├── recommendation/
│   │   ├── RecommendationsContext.js
│   │   ├── RecommendationProvider.jsx
│   │   └── hooks/
│   │       ├── useRecommendation.js
│   │       └── useRecommendationContext.js
│   ├── rooms/hooks/
│   │   ├── useMyRooms.js
│   │   ├── useRoomPlayback.js
│   │   └── useRoomsList.js
│   ├── search/hooks/
│   │   ├── useSearchSongs.js
│   │   ├── useSearchPeople.js
│   │   └── useSearchAlbums.js
│   └── social/hooks/
│       ├── useFollow.js
│       └── useFollowList.js
├── context/
│   ├── auth/
│   │   ├── AuthContext.js
│   │   └── AuthProvider.jsx
│   ├── player/
│   │   ├── PlayerContext.js
│   │   ├── PlayerTimeContext.js
│   │   └── PlayerProvider.jsx
│   └── notifications/
│       ├── NotificationsContext.js
│       └── NotificationsProvider.jsx
├── hooks/
│   ├── useAuth.js
│   ├── usePlayer.js
│   ├── usePlayerTime.js
│   ├── useNotificationsContext.js
│   ├── useDebounce.js
│   └── useFavorites.js
├── utils/
├── tokens/
├── icons/
└── index.js
```

Cambios clave en `shared`:

- Todos los hooks de una feature viven bajo `features/<dominio>/hooks/`; no quedan `use*.js` sueltos al lado de helpers.
- `hooks/` queda solo para hooks transversales o accesores de contextos globales.
- `useNotifications` deja de estar mezclado con el provider; el provider global vive en `context/notifications/`.
- `RecommendationProvider` y su contexto quedan dentro de `features/recommendation`, porque el provider es local a un perfil, no global.
- `sidebarMotion.js` y los `DRAG_*` de `reorderConfig.js` salen de `shared` y pasan a `frontend/src/lib/motion/`.
- `reorderConfig.js` conserva solo lo que sea lógica compartida real, como `REORDER_DEBOUNCE_MS`.
- Se elimina la duplicación `useSongSearch` / `useSearchSongs`: queda un único hook canónico de búsqueda de canciones.
- `tokens/` e `icons/` siguen en `shared` como datos compartidos, pero se exponen por subpaths explícitos.

### 2.4 API pública de shared

Hoy `shared/src/index.js` exporta todo con `export *` y, aun así, las apps necesitan imports profundos. La propuesta es declarar una API pública real:

```json
{
  "exports": {
    ".": "./src/index.js",
    "./tokens": "./src/tokens/tokens.js",
    "./icons": "./src/icons/icons.js",
    "./assets/*": "./assets/*"
  }
}
```

Reglas:

- `@synthos/shared` es el barrel de negocio: services, hooks, contextos y utils.
- `@synthos/shared/tokens`, `@synthos/shared/icons` y `@synthos/shared/assets/*` son los únicos accesos de diseño.
- Ninguna app importa `@synthos/shared/src/...`.
- Los deep imports actuales de `HomeDesktop` y mobile se corrigen exportando lo que falta o usando los subpaths.
- El lint de cada app puede bloquear `@synthos/shared/src/*` con `no-restricted-imports`.

### 2.5 Convenciones de nombres e imports

Propuesta concreta:

- Páginas: `pages/<dominio>/<Nombre>Page.jsx`. El sufijo `Page` elimina la ambigüedad con componentes.
- Features: `features/<dominio>/components/<Nombre>.jsx`, `features/<dominio>/hooks/use<Nombre>.js`, `features/<dominio>/lib/<nombre>.js`.
- Componentes compartidos: `components/<tipo>/<Nombre>.jsx`.
- Hooks globales: `hooks/use<Nombre>.js`.
- Contextos globales: `context/<dominio>/<Dominio>Context.js` + `<Dominio>Provider.jsx`.
- Archivos `.jsx` solo si devuelven JSX. Un hook sin JSX va en `.js`; un primitivo TypeScript puede ir en `.tsx`.
- Dominios en inglés y consistentes con la API (`rooms`, `playlists`, `notifications`, `popular`, `profile`). El copy visible sigue en español.
- Imports: `@/...` para cruzar carpetas dentro de `frontend/src`; relativos solo para archivos hermanos.
- Los ejemplos y páginas de demo no viven en `components/ui`; van a `pages/dev` o `dev/`.

## 3. Diferencias con la estructura actual

| Tema             | Hoy                                                                                 | Propuesto                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Páginas         | `pages/` tiene solo `Landing` y `Components`; 19 rutas viven en `features/` | Una página por ruta en `pages/`, con sufijo `*Page`                                        |
| Features         | Mezclan pantallas, secciones, modales, tarjetas, widgets de sidebar y helpers       | Solo UI de dominio, con `components/`, `hooks/` y `lib/`                                  |
| Componentes      | `components/layout` y `components/player` dependen de features                  | `app/layout` compone; `features/player` es una feature; `components/` no importa features |
| Hooks            | Top-level, features y componentes, sin regla única                                 | Top-level solo transversales; feature hooks bajo `features/<dominio>/hooks/`                  |
| Contextos        | Tres patrones distintos                                                             | `context/<dominio>/Context.js` + `Provider.jsx`; accesores en `hooks/`                    |
| API de shared    | Barrel amplio + imports profundos                                                   | Barrel de negocio + subpaths explícitos; prohibido `shared/src/*`                            |
| Constantes de UI | `SIDEBAR_SPRING`, `DRAG_*` dentro de shared                                     | `frontend/src/lib/motion/`                                                                    |
| Naming           | Mezcla español/inglés, `View`/`Public`, carpetas repetidas                    | Dominios en inglés, páginas `*Page`, componentes PascalCase                                 |
| Imports          | `@/` y relativos mezclados                                                        | `@/` para cruzar carpetas; relativo solo para hermanos                                        |
| Demo             | Ejemplos dentro de `components/ui` y ruta `/components`                         | `pages/dev/` o `dev/`, fuera del design system                                              |
| Código muerto   | `notificationsMock`, `HomeMobile`, ejemplos en producción                      | Eliminar o conectar; no dejarlo dentro de una feature                                           |

### Ejemplos de mudanza

- `features/home/Home.jsx` → `pages/home/HomePage.jsx`.
- `features/home/HomeDesktop.jsx` y `HomeMobile.jsx` → `features/home/components/`.
- `features/playlists/Playlists.jsx` → `pages/playlists/PlaylistsPage.jsx`.
- `features/playlists/PlaylistDetail.jsx` → `pages/playlists/PlaylistDetailPage.jsx`; sus componentes actuales quedan en `features/playlists/components/`.
- `features/social/FollowList.jsx` → `pages/profile/FollowListPage.jsx`.
- `features/notifications/Notifications.jsx` → `pages/notifications/NotificationsPage.jsx`; `NotificationRow.jsx` queda en `features/notifications/components/`.
- `features/albums/Albums.jsx`, `artists/Artists.jsx` y `popular/Populares.jsx` → `pages/catalog/` con nombres `AlbumsPage`, `ArtistsPage`, `PopularPage`.
- `components/layout/*` → `app/layout/*`.
- `components/player/*` → `features/player/components/*`.
- `components/RecommendationSection`, `RecommendSongModal` y `SongSearchStep` → `features/recommendation/components/`.
- `components/home/HomeSection.jsx` → `features/home/components/HomeSection.jsx`.
- `shared/src/features/**/use*.js` → `shared/src/features/<dominio>/hooks/use*.js`.
- `shared/src/hooks/useRecommendation.jsx` → `shared/src/features/recommendation/hooks/useRecommendation.js`.
- `shared/src/hooks/useSongsSearch.jsx` se elimina o se unifica con `useSearchSongs.js`.
- `shared/src/utils/sidebarMotion.js` → `frontend/src/lib/motion/sidebar.js`.
- Los `DRAG_*`/springs de `shared/src/features/playlists/reorderConfig.js` → `frontend/src/lib/motion/drag.js`.

## 4. Deudas que la estructura no resuelve sola

Mover archivos no arregla todo. Estas quedan para después, pero la estructura nueva las deja visibles:

- `PlaylistDetail` sigue siendo una página muy grande; necesita componentización y extracción de hooks, pero eso queda fuera de este pedido.
- `useSearchSongs`, `useSearchPeople` y `useSearchAlbums` repiten casi el mismo patrón; después de moverlos conviene unificarlos.
- Los `subscribeToPlaylists` / `subscribeToRooms` dentro de services son un store encubierto. Si se quiere una capa más limpia, deberían vivir en `features/<dominio>/events.js` y dejar los services sin estado.
- `notificationsMock.js` y `HomeMobile` están sin uso; hay que decidir si se eliminan o se conectan.
- `docs/ESTRUCTURA.md` describe una estructura que ya no coincide con el código; conviene actualizarlo después de aprobar esta propuesta.

## 5. Resumen

La estructura actual tiene un problema de **fronteras**, no de cantidad de archivos: `features/` hace de páginas, de componentes y de hooks; `components/` depende de `features/`; `shared/` mezcla lógica de negocio con constantes de animación web y no tiene una API pública clara; y los hooks aparecen en tres lugares distintos.

La propuesta separa `pages`, `features`, `components`, `app`, `hooks`, `lib` y `shared`, define una dirección de dependencias y deja una regla única para hooks, contextos, nombres e imports. No crea componentes nuevos: reubica los existentes y define dónde debe vivir cada cosa.

No modifiqué ningún archivo del proyecto.
