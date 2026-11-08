import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePlaylistList, usePlaylistsPage } from '@synthos/shared'
import playlistIcon from '@synthos/shared/assets/icons/playlist.svg'
import closeIcon from '@synthos/shared/assets/icons/close.svg'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PlaylistCreateForm from '@/features/playlists/components/PlaylistCreateForm.jsx'
import PlaylistInvitations from '@/features/playlists/components/PlaylistInvitations.jsx'
import PlaylistTile from '@/features/playlists/components/PlaylistTile.jsx'

const TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'mis', label: 'Mis playlists' },
  { key: 'colaborativas', label: 'Colaborativas' },
  { key: 'invitaciones', label: 'Invitaciones' },
]

export default function PlaylistsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { playlists, error, loading } = usePlaylistList()
  const { creating, setCreating, handleCreate } = usePlaylistsPage()

  const tab = TABS.some((item) => item.key === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'todos'

  function onTabChange(key) {
    setSearchParams(key === 'todos' ? {} : { tab: key })
  }

  async function onSubmitCreate({ name, description }) {
    const created = await handleCreate({ name, description })
    navigate(`/playlists/${created.id}`)
  }

  const allPlaylists = playlists.filter(
    (playlist) => playlist.role === 'creator' || playlist.role === 'colaborator'
  )
  const mine = playlists.filter((playlist) => playlist.role === 'creator')
  const collaborative = playlists.filter(
    (playlist) => playlist.isCollaborative && playlist.role !== 'creator'
  )

  return (
    <section className="px-6 py-4 md:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="Header3">Playlists</h1>

        <Popover open={creating} onOpenChange={setCreating}>
          <PopoverTrigger
            render={
              <button
                type="button"
                aria-label={creating ? 'Cancelar creación de playlist' : 'Crear playlist'}
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-accent pr-4 pl-3 text-lighter transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            }
          >
            <span
              aria-hidden="true"
              className={`Header3 font-light leading-none transition-transform duration-200 ${creating ? '' : 'rotate-45'}`}
            >
              <img src={closeIcon} alt="" aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="TextLarge">Crear</span>
          </PopoverTrigger>

          <PopoverContent align="end" className="w-80">
            <PopoverHeader>
              <PopoverTitle className="text-muted-foreground">Nueva playlist</PopoverTitle>
            </PopoverHeader>
            <PlaylistCreateForm
              onCreate={onSubmitCreate}
              onCancel={() => setCreating(false)}
            />
          </PopoverContent>
        </Popover>
      </div>

      {error && <p className="mt-6 rounded px-3 py-2 Salmon TextMedium">{error}</p>}

      <Tabs value={tab} onValueChange={onTabChange} className="mt-6">
        <div className="flex items-center gap-3 md:gap-4">
          <TabsList aria-label="Secciones de playlists" wrapperClassName="w-auto">
            {TABS.map((item) => (
              <TabsTrigger key={item.key} value={item.key}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="todos">
          <PlaylistGrid tab="todos" items={allPlaylists} loading={loading} />
        </TabsContent>
        <TabsContent value="mis">
          <PlaylistGrid tab="mis" items={mine} loading={loading} />
        </TabsContent>
        <TabsContent value="colaborativas">
          <PlaylistGrid tab="colaborativas" items={collaborative} loading={loading} />
        </TabsContent>
        <TabsContent value="invitaciones">
          <PlaylistInvitations />
        </TabsContent>
      </Tabs>
    </section>
  )
}

function PlaylistGrid({ tab, items, loading }) {
  if (loading) {
    return <p className="text-muted-foreground TextRegluar mt-8">Cargando tus playlists…</p>
  }

  if (items.length === 0) {
    return <EmptyState tab={tab} />
  }

  return (
    <ul className="mt-8 grid grid-cols-2 gap-4 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {items.map((playlist) => (
        <li key={playlist.id}>
          <PlaylistTile playlist={playlist} />
        </li>
      ))}
    </ul>
  )
}

function EmptyState({ tab }) {
  const copy = {
    todos: {
      title: 'Todavía no tenés playlists',
      body: 'Creá la primera y empezá a guardar canciones.',
    },
    mis: {
      title: 'Todavía no tenés playlists',
      body: 'Creá la primera y empezá a guardar canciones.',
    },
    colaborativas: {
      title: 'No te compartieron ninguna playlist',
      body: 'Cuando alguien te invite a una colaborativa, aparece acá.',
    },
  }[tab]

  return (
    <div className="py-16 text-center">
      <img
        src={playlistIcon}
        alt=""
        aria-hidden="true"
        className="mx-auto h-10 w-10 invert opacity-50"
      />
      <p className="text-foreground Header4 mt-4">{copy.title}</p>
      <p className="text-muted-foreground TextRegluar mt-1">{copy.body}</p>
    </div>
  )
}