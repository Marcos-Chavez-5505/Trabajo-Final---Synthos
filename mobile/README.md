# Mobile — SYNTHOS

App Expo (React Native) para la aplicacion de musica social. Fase 7+ — navegacion con Expo Router, motor de audio adaptado y variables de entorno especificas.

## Stack Tecnologico

- **Framework**: React Native + Expo (SDK ~58)
- **Navegacion**: Expo Router (rutas en `src/app/`)
- **Audio**: Motor adaptado (web: `HTMLAudioElement`, mobile: `expo-audio`)
- **Storage**: `expo-secure-store` (token), `expo-file-system` (archivos)
- **UI**: Componentes reutilizables desde `@synthos/shared` y `shared/assets/icons`

## Navegacion y Rutas

- Todas las routes viven en `src/app/` — cada archivo es una screen.
- `_layout.tsx` files definen los navegadores.
- Usar `Link`, `router`, y `useLocalSearchParams` desde `expo-router`.

## Motor de Audio

La logica se separa en:

1. **Lógica compartida** (`PlayerContext` global): cola, shuffle, repeat, modo sala, posición con `serverNow`.
2. **Motor con interfaz** `load(src, song?) / play / pause / seek / onTimeUpdate / onLoadedMetadata / onEnded / getCurrentTime / getDuration / setMuted / hasSource`.

- **Web**: adaptador en `frontend/src/lib/audioMotor.js` usando `HTMLAudioElement`.
- **Mobile**: adaptador en `mobile/lib/audioMotor.js` usando `expo-audio`.
- Al crear el motor mobile: `setAudioModeAsync({ playsInSilentMode, shouldPlayInBackground, interruptionMode: 'doNotMix' })`.
- Para lock screen: `setActiveForLockScreen(...)` al reproducir.
- **Segundo plano**: `enableBackgroundPlayback: true` — solo en development build, no en Expo Go.
- En Expo Go el motor desactiva estos features (`isRunningInExpoGo()`).

## Adaptador de Storage (Token)

- **Contrato async**: `getItem/setItem/removeItem` en Promise.
- Web envuelve `localStorage`; mobile usa `expo-secure-store`.
- `AuthContext` lo espera al arrancar.

## Configuración de API

Llamado al iniciar cada app mediante `configureApi({ baseUrl, storage, onUnauthorized })`:

- **Web**: `VITE_API_URL` (desde `import.meta.env`).
- **Mobile**: `EXPO_PUBLIC_API_URL` (desde `expo` config).

## Scripts disponibles

| Script | Descripcion |
|---|---|
| `npm start` | Servidor de desarrollo Expo |
| `npm run android` | Abrir en Android |
| `npm run ios` | Abrir en iOS |
| `npm run web` | Expo web |
| `npx expo lint` | Lint de Expo |
| `npx tsc --noEmit` | Typecheck |

## Iconos

- **.svg fuente única**: `shared/assets/icons/*.svg` (recoloreables).
- **Web**: los importa como URL desde `@synthos/shared/assets/icons/x.svg`.
- **Mobile**: dibuja desde el catálogo generado `shared/src/icons/icons.js` con `react-native-svg`.
- **Nunca** usar sufijo `?react` — revienta con `InvalidCharacterError`.
- Generar/catalogar: `npm run generate:icons -w shared` y verificar con `npm run check:icons -w shared`.

## Paquete Shared (@synthos/shared)

- Código puro, sin DOM, sin CSS, sin router.
- Restricción: `shared/` no importa de `mobile/` (garantido por lint `no-restricted-imports`).
- Ver `../shared/README.md` para detalles de exports y tokens.

## Regla importante

Si `ios/` y `android/` directories no existen, son generadas por Continuous Native Generation. Nunca crear/editar a mano — configurar en `app.json` y config plugins.