import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { tokenSections } from '../src/tokens/tokens.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = resolve(__dirname, '../../frontend/src/styles/tokens.css')

const header = `/* Única fuente de verdad de los design tokens.
 *
 * Los valores vienen de la especificación de diseño (antes styles.css) y no se
 * tocan: acá viven todos los literales de color, tamaño, peso y sombra.
 * Cualquier otro archivo del proyecto se deriva con var():
 *   - styles/utilities.css -> clases .Wall, .Fucsia, .TextRegluar, ...
 *   - styles/base.css       -> resets
 *   - src/index.css         -> puente semántico de shadcn
 */
`

const bodyLines = [':root {']
for (let i = 0; i < tokenSections.length; i++) {
  const section = tokenSections[i]
  if (i > 0) bodyLines.push('')
  bodyLines.push(`  /* ${section.comment} */`)
  for (const entry of section.tokens) {
    if (entry === null) {
      bodyLines.push('')
    } else {
      const [name, value] = entry
      bodyLines.push(`  ${name}: ${value};`)
    }
  }
}
bodyLines.push('}')

const css = `${header}\n${bodyLines.join('\n')}\n`.replace(/\n/g, '\r\n')
writeFileSync(outPath, css, 'utf8')
console.log(`Generated ${outPath}`)