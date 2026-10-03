import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout.jsx'
import Landing from '../pages/Landing/Landing.jsx'
import Home from '../features/home/Home.jsx'
import Login from '../features/auth/Login.jsx'
import Register from '../features/auth/Register.jsx'
import ProfileView from '../features/profile/ProfileView.jsx'
import ProfilePublic from '../features/profile/ProfilePublic.jsx'
import Search from '../features/search/Search.jsx'
import Playlists from '../features/playlists/Playlists.jsx'
import PlaylistDetail from '../features/playlists/PlaylistDetail.jsx'
import PublicOnly from './PublicOnly.jsx'
import RequireAuth from './RequireAuth.jsx'

// TODO(agente): las pantallas de abajo son shells navegables. Cada una se
// implementa en su sprint (salas, búsqueda, social).
function ScreenPlaceholder({ title }) {
  return (
    <div className="p-6 md:p-10">
      <h1 className="Header3">{title}</h1>
      <p className="mt-2 TextRegluar opacity-70">Pantalla en construcción.</p>
    </div>
  )
}

function Protected({ children }) {
  return (
    <RequireAuth>
      <AppLayout>{children}</AppLayout>
    </RequireAuth>
  )
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <Register />
          </PublicOnly>
        }
      />

      <Route path="/home" element={<Protected><Home /></Protected>} />
      <Route
        path="/perfil"
        element={<Protected><ProfileView /></Protected>}
      />
      <Route
        path="/populares"
        element={<Protected><ScreenPlaceholder title="Populares" /></Protected>}
      />
      {/* TS-09: biblioteca personal. react-router rankea los paths, así que el
          `/playlists/:id` no matchea el `/playlists` exacto sin importar el
          orden. */}
      <Route
        path="/playlists"
        element={<Protected><Playlists /></Protected>}
      />
      <Route
        path="/playlists/:id"
        element={<Protected><PlaylistDetail /></Protected>}
      />
      <Route
        path="/albums"
        element={<Protected><ScreenPlaceholder title="Albums" /></Protected>}
      />
      <Route
        path="/artistas"
        element={<Protected><ScreenPlaceholder title="Artistas" /></Protected>}
      />
      <Route
        path="/salas"
        element={<Protected><ScreenPlaceholder title="Salas" /></Protected>}
      />
      <Route path="/buscar" element={<Protected><Search /></Protected>} />
      {/* `/profile/:id` es el perfil público de otra persona (TS-08). Va fuera de
          `Protected` a propósito: es una vista de lectura y no debería depender
          de que haya sesión. */}
      <Route
        path="/profile/:id"
        element={<AppLayout><ProfilePublic /></AppLayout>}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}