# AGENTS.md

Léelo antes de generar código.
Precedencia en conflicto: `AGENTS.md` → `docs/ESPECIFICACIONES-BACKEND.md` → el resto.
Si un doc contradice el código, manda el código y se actualiza el doc.

## Proyecto

- App de música social. Web (desktop) + APK instalable (mobile), mismo codebase.
- Stack: React + Tailwind CSS + Vite. Mobile: Capacitor (build web envuelto, sin lógica nativa separada).

## Comandos (desde la raíz)

- `npm run dev -w frontend` (o `npm run dev`): dev server de Vite.
- `npm run build -w frontend` (o `npm run build`): build de producción.
- `npm run lint -w frontend` (o `npm run lint`): lint del frontend (oxlint).
- `npm run lint -w shared`: lint de `shared/` (ESLint, guardas de DOM/imports).
- `npm run generate:tokens -w shared`: regenera `frontend/src/styles/tokens.css` desde `shared/src/tokens/tokens.js`.
- `npm run generate:icons -w shared`: regenera `shared/src/icons/icons.js` desde `shared/assets/icons/*.svg`.
- `npm run check:icons -w shared`: falla si el catálogo de íconos no coincide con los `.svg` (para CI).
- Tests: no hay comando documentado.
- Verificación mínima: lint y build de `Frontend`.

## Mapa de carpetas

- `backend/`: API. Fuera de "workspaces". Conserva su `package-lock.json`.
- `frontend/`: web (Vite), solo UI. Código en `frontend/src/`.
- `shared/`: `@synthos/shared`. Sin DOM, sin CSS, sin router. Exporta código fuente (`main: src/index.js`).
- `mobile/`: app Expo (Fase 7+). Tiene su propio `mobile/AGENTS.md`.
- `docs/`: documentación. `docs/plan/`: planes de sprint.

## Reglas duras

1. No reintroducir "Grupos". Usar `rooms` / "Sala" en variables, componentes, endpoints y copy.
2. Reutilizar `MediaCard` y variantes (`MiniMediaCard`, `RoomCard`) en todo grid. No crear variantes ad-hoc por pantalla.
3. Un solo `PlayerContext` global. Los componentes del player (`features/player/`) solo presentan: consumen el mismo estado.
4. Desktop/mobile: breakpoints Tailwind (`md:`, `lg:`). Duplicar componente solo si la interacción cambia (Sidebar vs BottomNav).
5. Toda llamada a red va en `services/`. Nunca `fetch` directo en un componente ni lógica de fetch en `components/`.
6. `mocks/` ya no existe: no hay datos falsos, todo habla con la API. Si reaparece, solo su `xService.js` puede importarla y se apaga al migrar.
7. Servicio nuevo → agregar su convención de nombres a `docs/agents/convenciones-nombres-api.md`.
8. Antes de una feature nueva, revisar si ya existe su folder en `features/`.
9. Planes de sprint: archivo nuevo en `docs/plan/`. No sobrescribir los anteriores.
10. Íconos: solo desde `shared/assets/*.svg`, nunca librerías de íconos. Web los importa como URL desde `@synthos/shared/assets/icons/*.svg` (sin sufijo `?react`: revienta con `InvalidCharacterError`). Mobile los dibuja desde el catálogo generado `shared/src/icons/icons.js` (`npm run generate:icons -w shared`), sin copiar paths. Marca/logo en `shared/assets/brand/`.
11. Tokens: hex, `px` de fuente y `box-shadow` viven solo en `src/styles/tokens.css`. Nunca en otro CSS ni en estilos inline; el resto se deriva con `var(--ds-*)`. Tras `npx shadcn add`, revisar `src/index.css` (pisa el design system).
12. Git. Sin autorización explícita del usuario, NO:
    - ejecutar `git push` (ni `--force`/`--force-with-lease`, ni tags);
    - crear ramas o tags;
    - abrir PRs;
    - hacer `reset --hard`/`rebase` sobre ramas ya publicadas.
    - Sí se puede: `status`, `diff`, `log`, `show` y commits locales.
    - Stagear con rutas explícitas. Nunca `git add .` ni `git add -A`.
    - Ante la duda, preguntar antes.
13. No salir del proyecto:
    - Leer y escribir solo dentro de la raíz del repo.
    - Nada de `..` ni carpetas vecinas (ni la que contiene al repo): ni para leer, escribir o comprobar si algo existe.
    - Aplica a `Read`/`Grep`/`Glob` y a shell (usar rutas relativas al `workdir`).
    - Archivo temporal: solo en la carpeta temporal que autorice el entorno.
14. `shared/` no importa de `frontend/` ni de `mobile/`. Los adaptadores se inyectan por configuración (lo garantiza el lint de `shared/`: `no-restricted-imports`).

## Convenciones y trampas

- Componentes: `PascalCase.jsx`, uno por archivo. Hooks: `useNombre.js`. Contexts: `NombreContext.jsx`.
- Services: `dominioService.js`, uno por recurso. Métodos `verbo + Recurso`.
- API REST: base `/api`, recursos en plural, minúsculas, sin verbos.
- Estado global: un Context por dominio transversal (Player, Auth). El estado de una feature queda local a ella.
- Salas sincronizadas por Socket.IO: exige backend Node persistente (estado en memoria). El chat en salas aún no existe.
- Skills externas: no instalar sin autorización explícita. Nunca `-g`, `-y` ni `--all`.

## Comportamiento

- Declara supuestos antes de implementar. Si hay duda o varias interpretaciones, pregunta o preséntalas.
- Si hay un enfoque más simple, dilo antes de avanzar.
- Mínimo código que resuelve lo pedido. Nada especulativo.
- Cambios quirúrgicos: no refactorices ni "mejores" código adyacente. Respeta el estilo existente.
- Código muerto ajeno: menciónalo, no lo borres. Sí borra imports/variables que tus cambios dejaron sin uso.
- Varios pasos: plan breve `1. [paso] → verificar: [chequeo]`. Tarea trivial: usa criterio.
- Detalle y ejemplos: `docs/agents/principios-comportamiento.md`.

## Documentación bajo demanda

| Si la tarea toca… | Lee antes de empezar |
|---|---|
| crear o mover archivos, `components/`, `features/`, layout, `Sidebar`, `BottomNav` | `docs/agents/arquitectura-frontend.md` |
| `shared/`, `mobile/`, workspaces, `configureApi`, storage del token, motor de audio | `docs/agents/monorepo-y-adaptadores.md` |
| nuevo service, hook o context, nombre de método, ruta `/api` | `docs/agents/convenciones-nombres-api.md` |
| color, token, CSS, `index.css`, shadcn, ícono, SVG | `docs/agents/estilos-e-iconos.md` |
| commit, rama, push, PR, `PR-DESCRIPTION.md` | `docs/agents/git-ramas-y-pr.md` |
| skill, `npx skills`, `find-skills` | `docs/agents/skills-externas.md` |
| chat, WebSocket, despliegue, Vercel, pendientes, backlog, notificaciones, sprint | `docs/agents/indice-docs-y-pendientes.md` |
| contrato de endpoint (request, response, errores, `curl`) | `docs/ESPECIFICACIONES-BACKEND.md` |