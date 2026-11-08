/**
 * Recorte y recompresión de la foto de perfil, en el navegador y antes de subirla.
 *
 * Por qué en el cliente y no en el backend: una foto de celular pesa 3-8 MB y
 * base64 la infla un 33 %. El body de una serverless function de Vercel corta
 * ~4.5 MB, así que mandar el archivo crudo no es una opción. Acá la imagen
 * entra por `<input type="file">` (o por la cámara), no por la red: el recorte y
 * la compresión no dependen de `api.js` y por eso este módulo no es un service
 * (regla 5 de AGENTS.md: la red pasa por `services/`).
 *
 * El objetivo son avatares: se muestran circulares y chicos en toda la app, así
 * que 1024px de lado mayor sobra y una calidad más baja no se nota.
 */

/** lado mayor máximo en px; el avatar se muestra como mucho a 192px (h-48) */
const MAX_DIMENSION = 1024

/** si aun así pesa más, se recorta en pasos de 0.85 hasta entrar */
const SCALE_STEPS = [1, 0.85, 0.7, 0.55, 0.4]

const MAX_BYTES = 1024 * 1024

const QUALITY_BY_TYPE = {
  'image/jpeg': 0.82,
  'image/webp': 0.8,
}

/** MIME con los que el backend y este helper se puesta de acuerdo (`image.service`). */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Tope de peso del archivo original, antes de comprimir. */
export const MAX_SOURCE_BYTES = 20 * 1024 * 1024

export function isAllowedImageType(mimetype) {
  return ALLOWED_IMAGE_TYPES.includes(mimetype)
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen.'))),
      type,
      quality,
    )
  })
}

/** Error de decodificación con mensaje propio: el del navegador está en inglés. */
function unreadableImage() {
  return new Error('No se pudo leer la imagen. Probá con otra foto.')
}

function fromBitmap(bitmap, close) {
  return {
    sourceWidth: bitmap.width,
    sourceHeight: bitmap.height,
    draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
    close,
  }
}

/**
 * Decodifica el archivo respetando la orientación EXIF: sin esto, una foto de
 * cámara queda rotada porque el `canvas` ignora el tag de orientación.
 *
 * Cualquier fallo termina en `unreadableImage()`: el `DOMException` de
 * `createImageBitmap` o el evento `error` de `Image` vienen en inglés y se
 * muestran tal cual en el formulario.
 */
async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return fromBitmap(bitmap, () => bitmap.close())
    } catch {
      // Safari y algunos Android no aceptan las opciones de orientación:
      // se reintenta sin ellas antes de rendirse.
      try {
        const bitmap = await createImageBitmap(file)
        return fromBitmap(bitmap, () => bitmap.close())
      } catch {
        throw unreadableImage()
      }
    }
  }

  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(unreadableImage())
      img.src = url
    })

    return {
      sourceWidth: image.naturalWidth,
      sourceHeight: image.naturalHeight,
      draw: (ctx, w, h) => ctx.drawImage(image, 0, 0, w, h),
      close: () => URL.revokeObjectURL(url),
    }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

function outputType(sourceType) {
  // Se conserva el formato de origen: el PNG puede traer canal alfa (avatar con
  // fondo transparente) y convertirlo a JPEG lo dejaría negro. Si el PNG igual
  // queda pesado, lo resuelven los pasos de escala de abajo.
  return sourceType
}

const EXTENSION_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/**
 * Recorta y recomprime una imagen de perfil.
 *
 * @param {File} file Archivo elegido por el usuario (o tomado con la cámara).
 * @returns {Promise<File>} Archivo listo para subir, con nombre `avatar.jpg`,
 *   `avatar.png` o `avatar.webp` según el formato de salida.
 * @throws {Error} Con mensaje en español si el archivo no se puede decodificar.
 */
export async function prepareProfileImage(file) {
  if (!isAllowedImageType(file.type)) {
    throw new Error('Formato no permitido: la foto debe ser JPG, PNG o WEBP.')
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('La imagen es demasiado grande. Elegí una de hasta 20 MB.')
  }

  const decoded = await decode(file)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  try {
    const type = outputType(file.type)
    const quality = QUALITY_BY_TYPE[type] ?? 0.82
    const base = Math.min(1, MAX_DIMENSION / Math.max(decoded.sourceWidth, decoded.sourceHeight))

    let best = null

    for (const scale of SCALE_STEPS) {
      const ratio = base * scale

      canvas.width = Math.max(1, Math.round(decoded.sourceWidth * ratio))
      canvas.height = Math.max(1, Math.round(decoded.sourceHeight * ratio))
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      decoded.draw(ctx, canvas.width, canvas.height)

      const blob = await canvasToBlob(canvas, type, quality)
      best = blob

      if (blob.size <= MAX_BYTES) break
    }

    const extension = EXTENSION_BY_TYPE[type] ?? 'jpg'

    return new File([best], `avatar.${extension}`, { type: best.type, lastModified: Date.now() })
  } finally {
    decoded.close()
  }
}

/** URL de objeto para previsualizar, con su limpieza. */
export function previewUrlFor(file) {
  return URL.createObjectURL(file)
}