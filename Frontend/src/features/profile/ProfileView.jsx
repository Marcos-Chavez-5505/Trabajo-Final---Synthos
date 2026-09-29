import { useState } from 'react'
import Avatar from '../../components/ui/Avatar.jsx'
import useAuth from '../../hooks/useAuth.js'
import ProfileEdit from './ProfileEdit.jsx'

export default function ProfileView() {
  const { user, loading } = useAuth()
  const [editing, setEditing] = useState(false)

  if (loading) return null

  if (!user) {
    return (
      <div className="p-6 md:p-10">
        <p className="TextRegluar">Iniciá sesión para ver tu perfil.</p>
      </div>
    )
  }

  if (editing) {
    return <ProfileEdit onDone={() => setEditing(false)} />
  }

  return (
    <div className="p-6 md:p-10">
      <section className="max-w-md rounded-lg p-6 SurfaceLight">
        <div className="flex items-center gap-4">
          <Avatar src={user.avatarUrl} name={user.username} className="h-24 w-24" />
          <div className="min-w-0">
            <h2 className="Header3 truncate">{user.username}</h2>
            <p className="truncate TextMedium opacity-70">{user.email}</p>
          </div>
        </div>

        <p className="mt-4 TextRegluar">{user.bio || 'Sin bio todavía.'}</p>

        <button
          onClick={() => setEditing(true)}
          className="mt-6 rounded px-4 py-2 Fucsia Button"
        >
          Editar perfil
        </button>
      </section>
    </div>
  )
}