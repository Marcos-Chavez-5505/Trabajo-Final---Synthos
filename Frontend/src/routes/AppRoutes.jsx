import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout.jsx'
import Landing from '../pages/Landing/Landing.jsx'
import Home from '../features/home/Home.jsx'
import Login from '../features/auth/Login.jsx'
import Register from '../features/auth/Register.jsx'
import ProfileView from '../features/profile/ProfileView.jsx'
import ProfilePublic from '../features/profile/ProfilePublic.jsx'
import Rooms from '../features/rooms/Rooms.jsx'
import CreateRoom from '../features/rooms/CreateRoom.jsx'
import RoomView from '../features/rooms/RoomView.jsx'
import MoodScan from '../features/mood/MoodScan.jsx'
import FollowList from '../features/social/FollowList.jsx'
import Search from '../features/search/Search.jsx'
import Playlists from '../features/playlists/Playlists.jsx'
import Components from '../pages/components/Components.jsx'
import PlaylistDetail from '../features/playlists/PlaylistDetail.jsx'
import Albums from '../features/albums/Albums.jsx'
import AlbumDetail from '../features/albums/AlbumDetail.jsx'
import Artists from '../features/artists/Artists.jsx'
import ArtistDetail from '../features/artists/ArtistDetail.jsx'
import Populares from '../features/popular/Populares.jsx'
import PublicOnly from './PublicOnly.jsx'
import RequireAuth from './RequireAuth.jsx'

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
        element={<Protected><Populares /></Protected>}
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
      {/* Catálogo de discos: grilla paginada y detalle por id. */}
      <Route
        path="/albums"
        element={<Protected><Albums /></Protected>}
      />
      <Route
        path="/albums/:id"
        element={<Protected><AlbumDetail /></Protected>}
      />
      <Route
        path="/artistas"
        element={<Protected><Artists /></Protected>}
      />
      <Route
        path="/artistas/:id"
        element={<Protected><ArtistDetail /></Protected>}
      />
      {/* TS-17/TS-16: listado de salas con buscador y orden por calificación del
          anfitrión. TS-14 agrega crear la sala y su pantalla: ambas detrás de
          `Protected` porque el backend exige sesión hasta para leer el detalle. */}
      <Route path="/salas" element={<Protected><Rooms /></Protected>} />
      <Route path="/salas/crear" element={<Protected><CreateRoom /></Protected>} />
      <Route path="/salas/:id" element={<Protected><RoomView /></Protected>} />
      {/* TS-20: recomendaciones por estado de ánimo. El detector se descarga
          cuando se entra a la pantalla, no al cargar la app. */}
      <Route path="/animo" element={<Protected><MoodScan /></Protected>} />
      <Route path="/buscar" element={<Protected><Search /></Protected>} />
      {/* Listas de seguidores y seguidos (TS-10). Las del propio usuario van
          dentro de `Protected` porque dependen de la sesión; las de otra persona
          no, igual que el perfil público del que cuelgan. Cada ruta declara la
          relación como prop, así `/perfil/cualquiera` no matchea nada. */}
      <Route
        path="/perfil/seguidores"
        element={<Protected><FollowList relation="seguidores" /></Protected>}
      />
      <Route
        path="/perfil/siguiendo"
        element={<Protected><FollowList relation="siguiendo" /></Protected>}
      />
      {/* `/profile/:id` es el perfil público de otra persona (TS-08). Va fuera de
          `Protected` a propósito: es una vista de lectura y no debería depender
          de que haya sesión. */}
      <Route
        path="/profile/:id"
        element={<AppLayout><ProfilePublic /></AppLayout>}
      />
      <Route
        path="/profile/:id/seguidores"
        element={<AppLayout><FollowList relation="seguidores" /></AppLayout>}
      />
      <Route
        path="/profile/:id/siguiendo"
        element={<AppLayout><FollowList relation="siguiendo" /></AppLayout>}
      />

      <Route path="/components" element={<Protected><Components /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}