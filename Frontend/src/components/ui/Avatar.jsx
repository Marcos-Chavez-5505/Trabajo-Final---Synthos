import { useState } from 'react'
import { blobatarUri } from 'blobatar/uri'

export default function Avatar({ src, name, className = '' }) {
  const classes = `shrink-0 rounded-full ${className}`

  // `failedKey` guarda el nombre cuyo blob no se pudo renderizar: el blob es
  // un `data:` generado en-process, así que un fallo solo puede venir de una
  // política de seguridad (CSP) o de un renderer que no decodifique ese SVG.
  // Guardar el nombre en vez de un booleano evita perder el estado cuando la
  // misma instancia recibe un usuario distinto (filas reutilizadas).
  const [failedKey, setFailedKey] = useState(null)

  if (src) {
    return <img src={src} alt={name ?? 'avatar'} className={`object-cover ${classes}`} />
  }

  // Sin foto subida: un blobatar determinístico por nombre, generado acá
  // (paquete `blobatar`, mismo código que blobatar.dev pero sin red). Así el
  // avatar default no depende de que el servicio exista: no hay request, no hay
  // cache que calentar, y cada persona es el mismo "criatura" en toda la app.
  const normalized = String(name ?? '').trim().toLowerCase()
  if (normalized && normalized !== failedKey) {
    return (
      <img
        src={blobatarUri(normalized)}
        alt={name}
        className={classes}
        onError={() => setFailedKey(normalized)}
      />
    )
  }

  const initial = name ? name.charAt(0).toUpperCase() : '?'
  return (
    <div className={`flex items-center justify-center Fucsia ${classes}`}>
      <span className="Button">{initial}</span>
    </div>
  )
}