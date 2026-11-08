Cuándo leer este documento: tocas `shared/` o `mobile/`, los workspaces, o compartes lógica entre web y mobile (storage del token, config de API, audio, archivos).
Origen: AGENTS.md original, secciones "Estructura del monorepo", "Adaptadores" y "Scripts desde la raíz".

# Monorepo y adaptadores

## Estructura del monorepo (raíz)

```
/
├── backend/     # sin cambios. Fuera de "workspaces". Conserva su package-lock.json
├── frontend/    # web (Vite). No se renombra. Queda solo la UI
├── shared/      # paquete @synthos/shared. Sin DOM, sin CSS, sin router. Exporta código fuente (main: src/index.js)
├── mobile/      # app Expo (Fase 7+)
└── package.json # { "workspaces": ["frontend", "shared", "mobile"] }
```

- `shared/` no importa nada de `frontend/` ni de `mobile/` (regla permanente).
- `react` es `peerDependency` de `shared`.
- El lint de `shared/` lo garantiza (`no-restricted-imports`).

## Adaptadores (compartir lógica entre web y mobile)

1. **Storage del token.** Contrato async (`getItem/setItem/removeItem` en Promise). Web envuelve `localStorage`; mobile usa `expo-secure-store`. `AuthContext` lo espera al arrancar.
2. **Config.** `configureApi({ baseUrl, storage, onUnauthorized })`, llamado al iniciar cada app. El código compartido no lee `import.meta.env` ni `process.env`. Web: `VITE_API_URL`. Mobile: `EXPO_PUBLIC_API_URL`.
3. **Motor de audio.** `PlayerContext` se separa en lógica (cola, shuffle, repeat, modo sala, posición con `serverNow`) y un motor con interfaz `load(src, song?) / play / pause / seek / onTimeUpdate / onLoadedMetadata / onEnded / getCurrentTime / getDuration / setMuted / hasSource`. `song` es opcional: mobile lo usa para la metadata del lock screen y web lo ignora. Web: `HTMLAudioElement` (adaptador en `frontend/src/lib/audioMotor.js`). Mobile: `expo-audio` (adaptador en `mobile/lib/audioMotor.js`), con `setAudioModeAsync({ playsInSilentMode, shouldPlayInBackground, interruptionMode: 'doNotMix' })` al crear el motor y `setActiveForLockScreen(...)` al reproducir. El segundo plano y los controles de bloqueo dependen del plugin `expo-audio` (`enableBackgroundPlayback: true`) y solo se pueden probar en un development build, no en Expo Go. En Expo Go el motor los desactiva con `isRunningInExpoGo()` (ese binario no trae el servicio nativo y su binding falla); en un development build se habilitan solos.
4. **Archivos.** `uploadProfilePicture` recibe "un archivo"; cada plataforma lo construye (`File` en web, `{ uri, name, type }` en RN).
5. **Íconos.** Los `.svg` viven una sola vez en `shared/assets/icons/*.svg` (recoloreables) y `shared/assets/brand/` (marca/logo). Web los importa como URL; mobile dibuja el catálogo generado `shared/src/icons/icons.js` con `react-native-svg` (`npm run generate:icons -w shared`). El `.svg` es la única fuente editable; el catálogo no se toca a mano.

## Scripts desde la raíz

- `npm run dev -w frontend` (o `npm run dev`): dev server de Vite.
- `npm run build -w frontend` (o `npm run build`): build de producción.
- `npm run lint -w frontend` (o `npm run lint`): lint del frontend (oxlint).
- `npm run lint -w shared`: lint de `shared/` (ESLint, guardas de DOM/imports).
- `npm run generate:tokens -w shared`: regenera `frontend/src/styles/tokens.css` desde `shared/src/tokens/tokens.js`.
- `npm run generate:icons -w shared`: regenera `shared/src/icons/icons.js` desde `shared/assets/icons/*.svg`.
- `npm run check:icons -w shared`: falla si el catálogo de íconos no coincide con los `.svg`.