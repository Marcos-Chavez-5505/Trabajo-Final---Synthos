import { mapApiError } from "@synthos/shared"

import { toast } from "@/components/ui/toast"

// Catálogo de toasts de la app. Sumar acá los mensajes nuevos en vez de
// repetir `toast.add` en cada componente.

const NETWORK_ERROR = /failed to fetch|networkerror|network request failed|load failed/i

function describeError(cause) {
  if (NETWORK_ERROR.test(cause?.message ?? "")) {
    return "No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo."
  }

  return mapApiError(cause)
}

export function showApiError(title, cause, id) {
  toast.add({
    id,
    type: "error",
    title,
    description: describeError(cause),
  })
}

export const toastMessages = {
  apiError: showApiError,

  songRemoveError(cause) {
    showApiError("No se pudo quitar la canción", cause, "song-remove-error")
  },

  playlistLoadError(cause) {
    showApiError("No se pudo cargar la playlist", cause, "playlist-load-error")
  },

  playlistSongsError(cause) {
    showApiError("No se pudieron cargar las canciones", cause, "playlist-songs-error")
  },

  playlistInvitationsError(cause) {
    showApiError("No se pudieron cargar las invitaciones", cause, "playlist-invitations-error")
  },

  playlistOrderError(cause) {
    showApiError("No se pudo guardar el orden", cause, "playlist-order-error")
  },

  playlistMemberRemoveError(cause) {
    showApiError("No se pudo sacar al participante", cause, "playlist-member-remove-error")
  },

  playlistCoverUploadError(cause) {
    showApiError("No se pudo actualizar la portada", cause, "playlist-cover-upload-error")
  },

  playlistCoverRemoveError(cause) {
    showApiError("No se pudo quitar la portada", cause, "playlist-cover-remove-error")
  },
}
