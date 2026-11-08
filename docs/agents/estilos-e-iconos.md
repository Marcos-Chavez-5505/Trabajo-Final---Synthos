Cuándo leer este documento: agregas o cambias un color, token, estilo CSS, ícono o SVG; o corres `npx shadcn add`.
Origen: AGENTS.md original, reglas 10 y 11.

# Íconos y tokens

## Íconos (regla 10)

- Fuente única: `shared/assets/icons/*.svg` (set de diseño propio, íconos recoloreables), nunca librerías de íconos. Marca/logo en `shared/assets/brand/` (fuera del catálogo).
- **Web**: se importan como **URL** desde `@synthos/shared/assets/icons/x.svg` (sin sufijo) y se usan con `<img src={...} alt="" aria-hidden="true" className="h-5 w-5" />`, dimensionados con utilidades Tailwind.
- **Mobile**: se dibujan desde el catálogo de datos `shared/src/icons/icons.js` con `react-native-svg` (`mobile/components/icons/index.jsx`, `fromCatalog("<archivo>")`). Contrato `<Icon size color />`. No copiar paths a mano.
- Catálogo generado: el `.svg` es la única fuente editable. Tras agregar o editar un SVG, correr `npm run generate:icons -w shared`; `npm run check:icons -w shared` falla si quedó desactualizado.
- **No** usar el sufijo `?react`: `@vitejs/plugin-react` no lo transforma en este proyecto. El import queda como string `data:image/svg+xml` y al renderizarlo como componente (`<Icon />`) revienta con `InvalidCharacterError: The tag name provided ('data:...')`.
- Los SVG traen `#F4F0F9` hardcodeado (= token `Lighter`) o `currentColor`. El generador lo normaliza fuera de los datos: web no puede recolorear un `<img>` (para estado activo se juega con el fondo del botón); mobile recibe el color por la prop `color`.
- Formato aceptado por el generador: `<svg>`, `<path>`, `<circle>` (se convierte a path exacto), `<g clip-path>` solo si el clip cubre todo el viewBox, y `fill`+`stroke` del mismo color. Cualquier otra cosa hace fallar el script listando todos los problemas de todos los archivos.
- Usar `<img>` con `alt` real solo para contenido (fotos, carátulas, avatares).

## Tokens (regla 11)

- Los literales viven solo en `src/styles/tokens.css`.
- Se derivan con `var(--ds-*)`:
  - `styles/utilities.css` (clases `.Wall`, `.Fucsia`, `.TextRegluar`…);
  - `styles/base.css` (resets);
  - el puente semántico de shadcn en `src/index.css` (`:root` con `--background`, `--primary`, `--sidebar*`… y el `@theme inline`).
- Nunca escribir un hex, un `px` de fuente o un `box-shadow` en otro archivo CSS ni en estilos inline de un componente.
- Color nuevo:
  1. Primero el token en `tokens.css`.
  2. Después su clase (si corresponde al design system) o su mapeo en el `:root` de `index.css` (si es una utilidad semántica de shadcn que lo necesita).
- Las clases del design system viven en `@layer components`, así que una utilidad Tailwind las sobrescribe (`className="Wall bg-red-500"`).
- ⚠️ `components.json` apunta `tailwind.css` a `src/index.css`. El CLI de shadcn reinyecta ahí su propio `:root` neutral, que al ir después en la cascada pisa el design system. Si se corre `npx shadcn add`, hay que revisar y volver a dejar el bloque en `var(--ds-*)`.
- `npm run generate:tokens -w shared` regenera `frontend/src/styles/tokens.css` desde `shared/src/tokens/tokens.js`.

## Efectos de media

- `.CoverGlow` y `.HeaderGlow` viven en `styles/utilities.css` y esperan la variable `--cover-url` con `url(...)`.
- `.CoverGlow` dibuja el blur en su `::before`; la imagen nítida va encima como `<img>` (con `isolation`, un `z-index:-1` se pinta sobre el fondo del propio elemento, no detrás).
- `.HeaderGlow` extiende el fondo a todo el ancho de la sección y puede sangrar hacia arriba; el topbar sticky de `AppLayout` tapa el corte superior con su degradé.