// Genera shared/src/icons/icons.js a partir de shared/assets/icons/*.svg.
//
//   node scripts/generate-icons.mjs           escribe el catálogo
//   node scripts/generate-icons.mjs --check   no escribe; sale con código 1 si el
//                                             catálogo no coincide con los .svg
//
// El .svg es la ÚNICA fuente editable. El catálogo es solo datos (sin React,
// sin DOM): web importa el .svg como URL y mobile dibuja el catálogo con
// react-native-svg.
//
// Alcance deliberadamente estricto. Se acepta:
//   <svg>, <path>, <circle> (se convierte a path exacto),
//   <g> sin atributos o solo con clip-path, y <defs>/<clipPath>/<rect> ÚNICAMENTE
//   si el clip cubre todo el viewBox (patrón de exportación de Figma, que no
//   recorta nada).
// Ante cualquier otra cosa (<rect> suelto, gradientes, transform, opacidad,
// colores distintos del color del ícono, subcarpetas...) el script NO adivina:
// informa TODOS los problemas de TODOS los archivos y termina con error sin
// escribir nada.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const SRC_DIR = join(here, '..', 'assets', 'icons')
const OUT_FILE = join(here, '..', 'src', 'icons', 'icons.js')

// Mismo criterio que generate-tokens.mjs: ajustar si el repo usa otro fin de línea.
const EOL = '\r\n'

// Colores que significan "el color del ícono" (se descartan del catálogo).
const ICON_COLORS = new Set(['#f4f0f9', 'currentcolor'])
const NO_PAINT = new Set(['none', 'transparent'])

const PAINT_ATTRS = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'fill-rule']
const SVG_ATTRS_IGNORED = new Set(['xmlns', 'xmlns:xlink', 'version', 'role', 'aria-hidden', 'focusable', 'width', 'height', 'viewBox'])
const SHAPE_IGNORED = new Set(['id', 'clip-rule'])
const PATH_ATTRS = new Set(['d', ...PAINT_ATTRS])
const CIRCLE_ATTRS = new Set(['cx', 'cy', 'r', ...PAINT_ATTRS])
const LINECAPS = new Set(['butt', 'round', 'square'])
const LINEJOINS = new Set(['miter', 'round', 'bevel'])

const num = (x) => String(Number(Number(x).toFixed(4)))

function parseAttrs(raw) {
  const attrs = {}
  for (const m of raw.matchAll(/([A-Za-z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    attrs[m[1]] = (m[2] ?? m[3]).trim()
  }
  return attrs
}

function circleToPath(cx, cy, r) {
  // Dos semicírculos: equivalente exacto de un círculo (relleno o trazo continuo).
  return `M${num(cx - r)} ${num(cy)}A${num(r)} ${num(r)} 0 1 0 ${num(cx + r)} ${num(cy)}A${num(r)} ${num(r)} 0 1 0 ${num(cx - r)} ${num(cy)}Z`
}

// Devuelve { icon } o { errors }
export function parseSvg(source) {
  const errors = []
  const text = source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\?[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')

  let svg = null
  const shapes = [] // { kind: 'path'|'circle', attrs }
  const clipPaths = new Map() // id -> rect | null
  const groupClipRefs = [] // ids referenciados por <g clip-path>
  const stack = []
  const seenBad = new Set()
  const bad = (msg) => {
    if (!seenBad.has(msg)) {
      seenBad.add(msg)
      errors.push(msg)
    }
  }
  let currentClip = null // { id, rect: null|attrs, extra: bool }

  for (const m of text.matchAll(/<(\/?)([A-Za-z][\w:.-]*)([^>]*?)(\/?)>/g)) {
    const [, closing, tag, rawAttrs, selfClose] = m

    if (closing) {
      const idx = stack.lastIndexOf(tag)
      if (idx >= 0) stack.length = idx
      if (tag === 'clipPath' && currentClip) {
        if (currentClip.id) clipPaths.set(currentClip.id, currentClip.ok ? currentClip.rect : null)
        currentClip = null
      }
      continue
    }

    const attrs = parseAttrs(rawAttrs)
    const parent = stack[stack.length - 1]
    const inClip = stack.includes('clipPath')

    if (tag === 'svg') {
      if (svg) bad('<svg> anidado no soportado')
      else svg = attrs
    } else if (inClip) {
      // Dentro de <clipPath> solo se admite UN <rect> sin transformaciones.
      if (tag !== 'rect') bad(`<${tag}> dentro de <clipPath> no soportado (solo un <rect>)`)
      else if (currentClip.rect) { bad('<clipPath> con más de un <rect>'); currentClip.ok = false }
      else {
        const extra = Object.keys(attrs).filter((a) => !['x', 'y', 'width', 'height', 'fill', 'id'].includes(a))
        if (extra.length) { bad(`<rect> de clipPath con atributo no soportado: ${extra.join(', ')}`); currentClip.ok = false }
        currentClip.rect = attrs
      }
    } else if (tag === 'clipPath') {
      const extra = Object.keys(attrs).filter((a) => a !== 'id')
      if (extra.length) bad(`<clipPath> con atributo no soportado: ${extra.join(', ')}`)
      if (!attrs.id) bad('<clipPath> sin id')
      currentClip = { id: attrs.id, rect: null, ok: true }
    } else if (tag === 'defs') {
      // contenedor; su contenido se valida por separado
    } else if (tag === 'g') {
      const extra = Object.keys(attrs).filter((a) => a !== 'id' && a !== 'clip-path')
      if (extra.length) bad(`<g> con atributo no soportado: ${extra.join(', ')}`)
      if (attrs['clip-path']) {
        const ref = /^url\(\s*#([^)\s]+)\s*\)$/.exec(attrs['clip-path'])
        if (ref) groupClipRefs.push(ref[1])
        else bad(`clip-path no soportado: "${attrs['clip-path']}"`)
      }
    } else if (tag === 'path') {
      shapes.push({ kind: 'path', attrs })
    } else if (tag === 'circle') {
      shapes.push({ kind: 'circle', attrs })
    } else {
      bad(`elemento <${tag}> no soportado`)
    }

    if (!selfClose) stack.push(tag)
    if (selfClose && tag === 'clipPath' && currentClip) {
      bad('<clipPath> vacío')
      currentClip = null
    }
  }

  if (!svg) return { errors: [...errors, 'no se encontró <svg>'] }

  // viewBox
  let vb = null
  if (svg.viewBox) {
    const parts = svg.viewBox.split(/[\s,]+/).filter(Boolean).map(Number)
    if (parts.length === 4 && parts.every(Number.isFinite)) vb = parts
    else errors.push(`viewBox inválido: "${svg.viewBox}"`)
  } else if (svg.width && svg.height) {
    const w = parseFloat(svg.width)
    const h = parseFloat(svg.height)
    if (Number.isFinite(w) && Number.isFinite(h)) vb = [0, 0, w, h]
    else errors.push('sin viewBox y width/height no numéricos')
  } else {
    errors.push('sin viewBox ni width/height')
  }
  const viewBox = vb ? vb.join(' ') : null

  for (const name of Object.keys(svg)) {
    if (!SVG_ATTRS_IGNORED.has(name) && !PAINT_ATTRS.includes(name)) errors.push(`atributo "${name}" no soportado en <svg>`)
  }

  // Un clip solo es transparente si cubre todo el viewBox.
  for (const id of new Set(groupClipRefs)) {
    if (!clipPaths.has(id)) { errors.push(`clip-path "#${id}" no está definido`); continue }
    const rect = clipPaths.get(id)
    if (!rect) continue // ya se informó el problema del <clipPath>
    if (!vb) continue
    const x = Number(rect.x ?? 0)
    const y = Number(rect.y ?? 0)
    const w = parseFloat(rect.width)
    const h = parseFloat(rect.height)
    const covers = [x, y, w, h].every(Number.isFinite) && x <= vb[0] && y <= vb[1] && x + w >= vb[0] + vb[2] && y + h >= vb[1] + vb[3]
    if (!covers) errors.push(`clip-path "#${id}" recorta el ícono (no cubre todo el viewBox)`)
  }

  const inherit = {}
  for (const name of PAINT_ATTRS) if (svg[name] !== undefined) inherit[name] = svg[name]

  if (shapes.length === 0) errors.push('no tiene ningún <path> ni <circle>')

  const paths = []
  shapes.forEach(({ kind, attrs }, i) => {
    const where = `${kind} #${i + 1}`
    let ok = true
    const fail = (msg) => { errors.push(`${where}: ${msg}`); ok = false }

    const allowed = kind === 'path' ? PATH_ATTRS : CIRCLE_ATTRS
    for (const name of Object.keys(attrs)) {
      if (!allowed.has(name) && !SHAPE_IGNORED.has(name)) fail(`atributo "${name}" no soportado`)
    }

    let d
    if (kind === 'path') {
      if (!attrs.d) fail('sin atributo d')
      d = attrs.d
    } else {
      const [cx, cy, r] = [attrs.cx ?? '0', attrs.cy ?? '0', attrs.r].map(Number)
      if (![cx, cy, r].every(Number.isFinite) || !(r > 0)) fail('cx/cy/r inválidos')
      else d = circleToPath(cx, cy, r)
    }
    if (!ok) return

    const get = (name) => attrs[name] ?? inherit[name]
    const paint = (name) => {
      const raw = get(name)
      if (raw === undefined) return undefined
      const v = raw.toLowerCase()
      if (NO_PAINT.has(v)) return 'none'
      if (ICON_COLORS.has(v)) return 'color'
      fail(`${name}="${raw}" no es el color del ícono (${[...ICON_COLORS].join(' / ')}) ni "none"`)
      return undefined
    }

    const fill = paint('fill')
    const stroke = paint('stroke') ?? 'none'
    if (!ok) return
    if (fill === undefined) return fail('sin fill explícito (en SVG el valor por defecto sería negro)')
    if (fill === 'none' && stroke === 'none') return fail('ni fill ni stroke: sería invisible')

    const path = { d: d.replace(/\s+/g, ' ').trim() }

    if (fill === 'color') {
      const rule = get('fill-rule')
      if (rule === 'evenodd') path.fillRule = 'evenodd'
      else if (rule !== undefined && rule !== 'nonzero') return fail(`fill-rule inválido: "${rule}"`)
    }
    if (stroke === 'color') {
      path.stroke = true
      if (fill === 'color') path.fill = true // relleno + trazo del mismo color
      const width = get('stroke-width') === undefined ? 1 : Number(get('stroke-width'))
      if (!Number.isFinite(width) || width <= 0) return fail(`stroke-width inválido: "${get('stroke-width')}"`)
      path.strokeWidth = width
      const cap = get('stroke-linecap')
      if (cap !== undefined) {
        if (!LINECAPS.has(cap)) return fail(`stroke-linecap inválido: "${cap}"`)
        path.strokeLinecap = cap
      }
      const join = get('stroke-linejoin')
      if (join !== undefined) {
        if (!LINEJOINS.has(join)) return fail(`stroke-linejoin inválido: "${join}"`)
        path.strokeLinejoin = join
      }
    }
    paths.push(path)
  })

  if (errors.length) return { errors }
  return { icon: { viewBox, paths } }
}

const q = (s) => JSON.stringify(s)
const pathLine = (p) => {
  const fields = [`d: ${q(p.d)}`]
  if (p.fill) fields.push('fill: true')
  if (p.fillRule) fields.push(`fillRule: ${q(p.fillRule)}`)
  if (p.stroke) fields.push('stroke: true', `strokeWidth: ${p.strokeWidth}`)
  if (p.strokeLinecap) fields.push(`strokeLinecap: ${q(p.strokeLinecap)}`)
  if (p.strokeLinejoin) fields.push(`strokeLinejoin: ${q(p.strokeLinejoin)}`)
  return `      { ${fields.join(', ')} },`
}

export function render(catalog) {
  const lines = [
    '// GENERADO por shared/scripts/generate-icons.mjs a partir de shared/assets/icons/*.svg.',
    '// NO EDITAR A MANO: modificar el .svg y correr `npm run generate:icons -w shared`.',
    '//',
    '// Solo datos (sin React ni DOM). Cada path es:',
    '//   relleno           : { d, fillRule? }',
    '//   trazo             : { d, stroke: true, strokeWidth, strokeLinecap?, strokeLinejoin? }',
    '//   relleno + trazo   : { d, fill: true, stroke: true, strokeWidth, fillRule?, ... }',
    '// El color NO está en los datos: lo pone quien dibuja (prop `color`).',
    '',
    'export const icons = {',
  ]
  for (const name of Object.keys(catalog).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    const { viewBox, paths } = catalog[name]
    lines.push(`  ${q(name)}: {`, `    viewBox: ${q(viewBox)},`, '    paths: [', ...paths.map(pathLine), '    ],', '  },')
  }
  lines.push('}', '')
  return lines.join(EOL)
}

function main() {
  const check = process.argv.includes('--check')
  if (!existsSync(SRC_DIR)) {
    console.error(`No existe ${SRC_DIR}`)
    process.exit(1)
  }
  const entries = readdirSync(SRC_DIR, { withFileTypes: true })
  const files = entries.filter((e) => e.isFile() && /\.svg$/i.test(e.name)).map((e) => e.name).sort()

  const problems = []
  // Un .svg dentro de una subcarpeta se ignoraría en silencio: mejor avisar.
  for (const e of entries) {
    if (e.isDirectory()) problems.push(`${e.name}/: subcarpetas no soportadas en assets/icons (mover fuera, p. ej. a assets/brand/)`)
  }

  const catalog = {}
  for (const file of files) {
    const { icon, errors } = parseSvg(readFileSync(join(SRC_DIR, file), 'utf8'))
    if (errors) errors.forEach((e) => problems.push(`${file}: ${e}`))
    else catalog[file.replace(/\.svg$/i, '')] = icon
  }

  if (problems.length) {
    console.error(`\n${problems.length} problema(s) en ${SRC_DIR}:\n`)
    problems.forEach((p) => console.error(`  - ${p}`))
    console.error('\nNo se escribió nada.')
    process.exit(1)
  }

  const output = render(catalog)
  if (check) {
    const current = existsSync(OUT_FILE) ? readFileSync(OUT_FILE, 'utf8') : null
    if (current !== output) {
      console.error('icons.js desactualizado: correr `npm run generate:icons -w shared`.')
      process.exit(1)
    }
    console.log(`OK: icons.js coincide con ${files.length} SVG.`)
    return
  }
  mkdirSync(dirname(OUT_FILE), { recursive: true })
  writeFileSync(OUT_FILE, output)
  console.log(`Generated ${OUT_FILE} (${files.length} íconos)`)
}

// Solo corre al ejecutarse directamente (permite importar parseSvg/render en pruebas).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()
