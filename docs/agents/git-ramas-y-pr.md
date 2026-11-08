Cuándo leer este documento: vas a commitear, crear una rama, hacer push, preparar un PR o escribir su descripción.
Origen: AGENTS.md original, regla 12 y §12.1.

# Git, ramas y PR

## Regla 12 (texto completo)

**Git: no subir commits ni crear ramas sin autorización previa.**

- No ejecutar `git push` (ni `--force`/`--force-with-lease`, ni tags).
- No crear ramas o tags.
- No abrir PRs.
- No hacer `reset --hard`/`rebase` sobre ramas ya publicadas.
- Excepción: que el usuario lo pida o lo autorice explícitamente en el mensaje.
- Sí se pueden hacer lecturas (`status`, `diff`, `log`, `show`) y commits locales.
- Ante la duda, **preguntar antes**: publicar afecta a otras personas y no se improvisa.

## 12.1 Criterio para ramas desprendidas de `dev`

Una vez que el usuario autoriza, cada cambio viaja en su propia rama saliendo de `dev`. Reglas:

- **Origen:** siempre `dev`, nunca desde otra rama de trabajo ni desde `main`. `dev` queda como rama de integración y no se commitea trabajo sin terminar.
- **Prefijo por tipo:** `feat/` funcionalidad nueva, `fix/` corrección de algo roto, `docs/` solo documentación o archivos `.md`. El prefijo va en el nombre de la rama, en minúsculas y con guiones.
- **Un cambio por rama.** Si en una misma tanda hay cosas de dominios distintos (por ejemplo una feature y una corrección de `AGENTS.md`), son ramas separadas, no un commit mixto.
- **Commits en español**, con el estilo de la regla 12 y cuerpo que explique el porqué, no el qué. Mensaje en imperativo, primera línea corta.
- **Nada ajeno por accidente.** Revisar `git status` antes de `git add` y stagear con rutas explícitas archivo por archivo, nunca con `git add .` ni `git add -A`. Archivo frecuentemente no deseado: el `package-lock.json` de la raíz (es un artefacto vacío, sin `package.json` que lo justifique; los locks reales viven en `Backend/` y `Frontend/`).
- **Verificar antes de pushear:** correr el lint y el build de `Frontend` (o el test que aplique). Recién con eso en verde se hace `git push -u origin <rama>`.
- **El PR lo abre el usuario.** El agente pushea la rama y pasa el link que devuelve GitHub (`.../pull/new/<rama>`), sin abrirlo.
- **Descripción de la rama.** Junto con el link del PR, el agente entrega un resumen breve con los puntos más importantes del cambio. Ese resumen se vuelca en `.github/PULL_REQUEST_TEMPLATE.md`, que GitHub carga automáticamente al abrir un PR contra `dev` o `main`. Los puntos se ordenan con alertas de Markdown (`> [!NOTE]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!TIP]`), no como texto plano suelto: en qué consiste el cambio, decisiones relevantes, riesgos y cómo verificarlo.
- **Archivo con la descripción.** Ese mismo resumen del PR además se escribe como archivo markdown en la **raíz del repo** (`PR-DESCRIPTION.md`), con el mismo contenido y estructura (encabezados y alertas) que entrega el agente, para que el usuario pueda copiarlo y pegarlo al abrir el PR a mano. Es un archivo de apoyo: no se commitea dentro de la rama del PR salvo pedido explícito, y se limpia después del merge.
- Al terminar, volver a `dev` para que el repo quede limpio y listo para el siguiente cambio.