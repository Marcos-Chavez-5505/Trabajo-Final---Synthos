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

  roomActionError(cause) {
    showApiError("No se pudo completar la acción", cause, "room-action-error")
  },

  roomLoadError(cause) {
    showApiError("No se pudo cargar la sala", cause, "room-load-error")
  },

  roomPlaybackError(cause) {
    showApiError("No se pudo sincronizar la reproducción", cause, "room-playback-error")
  },

  roomControlError(cause) {
    showApiError("No se pudo controlar la reproducción", cause, "room-control-error")
  },

  roomPlaySongError(cause) {
    showApiError("No se pudo reproducir la canción", cause, "room-play-song-error")
  },

  roomLeaveError(cause) {
    showApiError("No se pudo salir de la sala", cause, "room-leave-error")
  },

  roomCloseError(cause) {
    showApiError("No se pudo cerrar la sala", cause, "room-close-error")
  },

  roomKickError(cause) {
    showApiError("No se pudo sacar al participante", cause, "room-kick-error")
  },

  roomVoteError(cause) {
    showApiError("No se pudo votar para saltar", cause, "room-vote-error")
  },

  roomRateError(cause) {
    showApiError("No se pudo enviar la calificación", cause, "room-rate-error")
  },

  roomAccessLost(reason) {
    const copy =
      reason === "inactivity"
        ? {
            title: "Te sacamos de la sala",
            description:
              "La sala quedó inactiva y ya no tenés acceso. Te llevamos al listado de salas.",
          }
        : reason === "kicked"
          ? {
              title: "Te sacaron de la sala",
              description:
                "El anfitrión te quitó de esta sala. Te llevamos al listado de salas.",
            }
          : {
              title: "Ya no tenés acceso a la sala",
              description: "Te llevamos al listado de salas.",
            }

    toast.add({
      id: "room-access-lost",
      type: "info",
      ...copy,
    })
  },

  roomLeft(isHost) {
    toast.add({
      id: "room-left",
      type: "success",
      title: isHost ? "Cerraste la sala" : "Saliste de la sala",
      description: isHost
        ? "Saliste y la sala dejó de estar disponible para el resto."
        : "Podés volver a entrar con el código.",
    })
  },

  roomClosed() {
    toast.add({
      id: "room-closed",
      type: "success",
      title: "Cerraste la sala",
      description: "La sala ya no está disponible para el resto.",
    })
  },

  roomMemberKicked(username) {
    toast.add({
      id: "room-member-kicked",
      type: "success",
      title: "Sacaste a un participante",
      description: `${username || "El participante"} ya no está en la sala.`,
    })
  },
}
