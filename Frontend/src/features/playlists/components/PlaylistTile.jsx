import { useState } from 'react'
import { Link } from 'react-router-dom'
import { resolvePlaylistCoverUrl } from '@synthos/shared'
import headphonesIcon from '@synthos/shared/assets/icons/headphones.svg'
import userIcon from '@synthos/shared/assets/icons/user.svg'
import userGroupIcon from '@synthos/shared/assets/icons/user_group.svg'

export default function PlaylistTile({ playlist }) {
  const coverUrl = resolvePlaylistCoverUrl(playlist)
  const [failedCoverUrl, setFailedCoverUrl] = useState(null)
  const showCover = Boolean(coverUrl) && failedCoverUrl !== coverUrl
  const ownerName = playlist.creator?.username || 'Usuario'

  return (
    <article className="max-w-xs w-full">
      <Link
        to={`/playlists/${playlist.id}`}
        className="block bg-transparent hover:opacity-90"
      >
        <div className="CardRadius flex aspect-square items-center justify-center overflow-hidden">
          {showCover ? (
            <img
              src={coverUrl}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
              onError={() => setFailedCoverUrl(coverUrl)}
            />
          ) : (
            <div className="Light flex h-full w-full items-center justify-center">
              <img
                src={headphonesIcon}
                alt=""
                aria-hidden="true"
                className="h-10 w-10 opacity-70"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-foreground TextRegluar mt-3 truncate">{playlist.name}</h3>

            <p className="text-muted-foreground TextMedium mt-0.5 truncate">{ownerName}</p>
          </div>

          <img
            src={playlist.isCollaborative ? userGroupIcon : userIcon}
            alt={playlist.isCollaborative ? 'Playlist colaborativa' : 'Playlist personal'}
            className="ml-auto h-6 w-6 shrink-0 opacity-60"
          />
        </div>
      </Link>
    </article>
  )
}