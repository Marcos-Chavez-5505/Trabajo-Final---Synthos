// Cuántas páginas a cada lado de la actual se dibujan antes de cortar con
// elipsis.
const SIBLING_PAGES = 1

/**
 * Rango de páginas a mostrar: primera, última, actual y sus vecinas, con un hueco
 * en el medio. Las páginas que caen en el hueco vuelven `null`, que es la señal
 * para dibujar `<PaginationEllipsis />`.
 *
 * @param {number} current Página actual, 1-based.
 * @param {number} totalPages Total de páginas, mínimo 1.
 * @returns {Array<number|null>}
 */
export default function buildPageRange(current, totalPages) {
  if (totalPages <= 1) return [1]

  const pages = new Set([1, totalPages])

  for (let page = current - SIBLING_PAGES; page <= current + SIBLING_PAGES; page += 1) {
    if (page >= 1 && page <= totalPages) pages.add(page)
  }

  const sorted = [...pages].sort((a, b) => a - b)
  const range = []

  sorted.forEach((page, index) => {
    const previous = sorted[index - 1]

    if (previous !== undefined && page - previous > 1) range.push(null)

    range.push(page)
  })

  return range
}
