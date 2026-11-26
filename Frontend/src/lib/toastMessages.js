import { mapApiError, TOAST_COPY, TOAST_TITLES } from "@synthos/shared"

import { toast } from "@/components/ui/toast"

// Catálogo de toasts de la app. Sumar acá los mensajes nuevos en vez de
// repetir `toast.add` en cada componente. Los textos viven en @synthos/shared.

const NETWORK_ERROR = /failed to fetch|networkerror|network request failed|load failed/i

function describeError(cause) {
  // Los hooks de shared ya devuelven el error mapeado como string.
  if (typeof cause === "string") {
    return NETWORK_ERROR.test(cause) ? TOAST_COPY.networkError : cause
  }

  if (NETWORK_ERROR.test(cause?.message ?? "")) {
    return TOAST_COPY.networkError
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
    showApiError(TOAST_TITLES.songRemove, cause, "song-remove-error")
  },

  playlistLoadError(cause) {
    showApiError(TOAST_TITLES.playlistLoad, cause, "playlist-load-error")
  },

  playlistSongsError(cause) {
    showApiError(TOAST_TITLES.playlistSongsLoad, cause, "playlist-songs-error")
  },

  playlistInvitationsError(cause) {
    showApiError(TOAST_TITLES.playlistInvitationsLoad, cause, "playlist-invitations-error")
  },

  playlistOrderError(cause) {
    showApiError(TOAST_TITLES.playlistOrder, cause, "playlist-order-error")
  },

  playlistMemberRemoveError(cause) {
    showApiError(TOAST_TITLES.playlistMemberRemove, cause, "playlist-member-remove-error")
  },

  playlistCoverUploadError(cause) {
    showApiError(TOAST_TITLES.playlistCoverUpload, cause, "playlist-cover-upload-error")
  },

  playlistCoverRemoveError(cause) {
    showApiError(TOAST_TITLES.playlistCoverRemove, cause, "playlist-cover-remove-error")
  },

  roomActionError(cause) {
    showApiError(TOAST_TITLES.roomAction, cause, "room-action-error")
  },

  roomLoadError(cause) {
    showApiError(TOAST_TITLES.roomLoad, cause, "room-load-error")
  },

  roomPlaybackError(cause) {
    showApiError(TOAST_TITLES.roomPlayback, cause, "room-playback-error")
  },

  roomControlError(cause) {
    showApiError(TOAST_TITLES.roomControl, cause, "room-control-error")
  },

  roomPlaySongError(cause) {
    showApiError(TOAST_TITLES.roomPlaySong, cause, "room-play-song-error")
  },

  roomLeaveError(cause) {
    showApiError(TOAST_TITLES.roomLeave, cause, "room-leave-error")
  },

  roomCloseError(cause) {
    showApiError(TOAST_TITLES.roomClose, cause, "room-close-error")
  },

  roomKickError(cause) {
    showApiError(TOAST_TITLES.roomKick, cause, "room-kick-error")
  },

  roomVoteError(cause) {
    showApiError(TOAST_TITLES.roomVote, cause, "room-vote-error")
  },

  roomRateError(cause) {
    showApiError(TOAST_TITLES.roomRate, cause, "room-rate-error")
  },

  roomAccessLost(reason) {
    const copy = TOAST_COPY.roomAccessLost[reason] ?? TOAST_COPY.roomAccessLost.other

    toast.add({
      id: "room-access-lost",
      type: "info",
      ...copy,
    })
  },

  roomLeft(isHost, isPrivate) {
    const copy = TOAST_COPY.roomLeft[
      isHost ? "host" : isPrivate ? "private" : "public"
    ]

    toast.add({
      id: "room-left",
      type: "success",
      ...copy,
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

  albumsLoadError(cause) {
    showApiError(TOAST_TITLES.albumsLoad, cause, "albums-load-error")
  },

  artistsLoadError(cause) {
    showApiError(TOAST_TITLES.artistsLoad, cause, "artists-load-error")
  },

  popularSongsLoadError(cause) {
    showApiError(TOAST_TITLES.popularSongsLoad, cause, "popular-songs-load-error")
  },

  albumDetailError(cause) {
    showApiError(TOAST_TITLES.albumDetail, cause, "album-detail-error")
  },

  artistDetailError(cause) {
    showApiError(TOAST_TITLES.artistDetail, cause, "artist-detail-error")
  },

  followListLoadError(cause) {
    showApiError(TOAST_TITLES.followListLoad, cause, "follow-list-load-error")
  },

  profilePublicLoadError(cause) {
    showApiError(TOAST_TITLES.profilePublicLoad, cause, "profile-public-load-error")
  },

  followToggleError(cause) {
    showApiError(TOAST_TITLES.followToggle, cause, "follow-toggle-error")
  },

  playlistsLoadError(cause) {
    showApiError(TOAST_TITLES.playlistsLoad, cause, "playlists-load-error")
  },

  roomsLoadError(cause) {
    showApiError(TOAST_TITLES.roomsLoad, cause, "rooms-load-error")
  },

  roomJoinError(cause) {
    showApiError(TOAST_TITLES.roomJoin, cause, "room-join-error")
  },

  roomCreateError(cause) {
    showApiError(TOAST_TITLES.roomCreate, cause, "room-create-error")
  },

  moodSongsError(cause) {
    showApiError(TOAST_TITLES.moodSongs, cause, "mood-songs-error")
  },

  notificationsLoadError(cause) {
    showApiError(TOAST_TITLES.notificationsLoad, cause, "notifications-load-error")
  },

  homeSongsLoadError(cause) {
    showApiError(TOAST_TITLES.homeSongsLoad, cause, "home-songs-load-error")
  },

  homeArtistsLoadError(cause) {
    showApiError(TOAST_TITLES.homeArtistsLoad, cause, "home-artists-load-error")
  },

  homeAlbumsLoadError(cause) {
    showApiError(TOAST_TITLES.homeAlbumsLoad, cause, "home-albums-load-error")
  },

  playlistCreateError(cause) {
    showApiError(TOAST_TITLES.playlistCreate, cause, "playlist-create-error")
  },

  playlistInvitationAcceptError(cause) {
    showApiError(TOAST_TITLES.playlistInvitationAccept, cause, "playlist-invitation-accept-error")
  },

  playlistInvitationRejectError(cause) {
    showApiError(TOAST_TITLES.playlistInvitationReject, cause, "playlist-invitation-reject-error")
  },

  playlistUpdateError(cause) {
    showApiError(TOAST_TITLES.playlistUpdate, cause, "playlist-update-error")
  },

  searchSongsError(cause) {
    showApiError(TOAST_TITLES.searchSongs, cause, "search-songs-error")
  },

  searchPeopleError(cause) {
    showApiError(TOAST_TITLES.searchPeople, cause, "search-people-error")
  },

  searchAlbumsError(cause) {
    showApiError(TOAST_TITLES.searchAlbums, cause, "search-albums-error")
  },

  playlistInviteError(cause) {
    showApiError(TOAST_TITLES.playlistInvite, cause, "playlist-invite-error")
  },

  songSearchError(cause) {
    showApiError(TOAST_TITLES.songSearch, cause, "song-search-error")
  },

  recSongError(cause) {
    showApiError(TOAST_TITLES.recSong, cause, "rec-song-error")
  },

  recommendationsLoadError(cause) {
    showApiError(TOAST_TITLES.recommendationsLoad, cause, "recommendations-load-error")
  },

  profileEditError(cause) {
    showApiError(TOAST_TITLES.profileEdit, cause, "profile-edit-error")
  },

  loginError(cause) {
    showApiError(TOAST_TITLES.login, cause, "login-error")
  },

  registerError(cause) {
    showApiError(TOAST_TITLES.register, cause, "register-error")
  },
}
