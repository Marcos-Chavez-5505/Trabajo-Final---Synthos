import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import {
  acceptPlaylistInvitation,
  listReceivedInvitations,
  rejectPlaylistInvitation,
  subscribeToPlaylists,
} from '../../services/playlistsService.js'
import Avatar from '../../components/ui/Avatar.jsx'
import playlistIcon from '../../assets/playlist.svg'
import { mapApiError } from '../../utils/mapError.js'

/**
 * Bandeja de invitaciones a playlists colaborativas (TS-13), la tercera sub-pestaña
 * de `/playlists`.
 *
 * Solo trae las pendientes: al aceptar o rechazar la invitación desaparece de acá,
 * y el `subscribeToPlaylists` que dispara la mutación vuelve a pedir la lista.
 */
export default function PlaylistInvitations() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const userId = user?.id ?? null

  const [response, setResponse] = useState({ key: null, invitations: [], error: null })
  const [pendingId, setPendingId] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!userId) return undefined

    let active = true

    listReceivedInvitations(userId)
      .then((invitations) => {
        if (active) setResponse({ key: userId, invitations, error: null })
      })
      .catch((cause) => {
        if (active) setResponse({ key: userId, invitations: [], error: mapApiError(cause) })
      })

    return () => {
      active = false
    }
  }, [userId, version])

  useEffect(() => subscribeToPlaylists(() => setVersion((prev) => prev + 1)), [])

  async function handleAccept(invitation) {
    if (pendingId) return

    setPendingId(invitation.playlistId)
    setResponse((prev) => ({ ...prev, error: null }))

    try {
      await acceptPlaylistInvitation(userId, invitation.playlistId)
      navigate(`/playlists/${invitation.playlistId}`)
    } catch (cause) {
      setResponse((prev) => ({ ...prev, error: mapApiError(cause) }))
      setPendingId(null)
    }
  }

  async function handleReject(invitation) {
    if (pendingId) return

    setPendingId(invitation.playlistId)
    setResponse((prev) => ({ ...prev, error: null }))

    try {
      await rejectPlaylistInvitation(userId, invitation.playlistId)
    } catch (cause) {
      setResponse((prev) => ({ ...prev, error: mapApiError(cause) }))
    } finally {
      setPendingId(null)
    }
  }

  const isCurrent = response.key === userId
  const invitations = isCurrent ? response.invitations : []
  const error = isCurrent ? response.error : null

  if (!isCurrent) {
    return (
      <p className="text-muted-foreground TextRegluar mt-8">Cargando tus invitaciones…</p>
    )
  }

  if (error) {
    return <p className="mt-8 rounded px-3 py-2 Salmon TextMedium">{error}</p>
  }

  if (invitations.length === 0) {
    return (
      <div className="py-16 text-center">
        <img
          src={playlistIcon}
          alt=""
          aria-hidden="true"
          className="mx-auto h-10 w-10 invert opacity-50"
        />
        <p className="text-foreground Header4 mt-4">No tenés invitaciones</p>
        <p className="text-muted-foreground TextRegluar mt-1">
          Cuando alguien te invite a una playlist colaborativa, aparece acá para
          aceptarla.
        </p>
      </div>
    )
  }

  return (
    <ul className="mt-8 flex flex-col gap-3">
      {invitations.map((invitation) => (
        <li
          key={invitation.playlistId}
          className="SurfaceLight CardRadius Elevation1 flex flex-wrap items-center gap-4 p-4"
        >
          <div className="Light CardRadius flex h-14 w-14 shrink-0 items-center justify-center">
            <img
              src={playlistIcon}
              alt=""
              aria-hidden="true"
              className="h-6 w-6 invert opacity-70"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-foreground TextRegluar truncate">
              {invitation.playlist.name}
            </p>
            <p className="text-muted-foreground TextMedium mt-0.5 flex items-center gap-2">
              <Avatar
                src={invitation.sender.avatarUrl}
                name={invitation.sender.username}
                className="h-5 w-5"
              />
              <span className="truncate">{invitation.sender.username} te invitó</span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => handleReject(invitation)}
              disabled={pendingId !== null}
              className="rounded px-4 py-2 Volume Button hover:brightness-110 disabled:opacity-50"
            >
              Rechazar
            </button>
            <button
              type="button"
              onClick={() => handleAccept(invitation)}
              disabled={pendingId !== null}
              className="rounded px-4 py-2 Fucsia Button hover:brightness-110 disabled:opacity-50"
            >
              {pendingId === invitation.playlistId ? 'Uniéndome…' : 'Aceptar'}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}