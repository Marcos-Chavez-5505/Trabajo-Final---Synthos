import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '@/app/layout/AppLayout.jsx'
import LandingPage from '@/pages/landing/LandingPage.jsx'
import HomePage from '@/pages/home/HomePage.jsx'
import LoginPage from '@/pages/auth/LoginPage.jsx'
import RegisterPage from '@/pages/auth/RegisterPage.jsx'
import ProfilePage from '@/pages/profile/ProfilePage.jsx'
import PublicProfilePage from '@/pages/profile/PublicProfilePage.jsx'
import RoomsPage from '@/pages/rooms/RoomsPage.jsx'
import CreateRoomPage from '@/pages/rooms/CreateRoomPage.jsx'
import RoomPage from '@/pages/rooms/RoomPage.jsx'
import MoodPage from '@/pages/mood/MoodPage.jsx'
import FollowListPage from '@/pages/profile/FollowListPage.jsx'
import SearchPage from '@/pages/search/SearchPage.jsx'
import PlaylistsPage from '@/pages/playlists/PlaylistsPage.jsx'
import ComponentsPage from '@/pages/dev/ComponentsPage.jsx'
import PlaylistDetailPage from '@/pages/playlists/PlaylistDetailPage.jsx'
import AlbumsPage from '@/pages/catalog/AlbumsPage.jsx'
import AlbumDetailPage from '@/pages/catalog/AlbumDetailPage.jsx'
import ArtistsPage from '@/pages/catalog/ArtistsPage.jsx'
import ArtistDetailPage from '@/pages/catalog/ArtistDetailPage.jsx'
import PopularPage from '@/pages/catalog/PopularPage.jsx'
import NotificationsPage from '@/pages/notifications/NotificationsPage.jsx'
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
      <Route path="/" element={<LandingPage />} />

      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <RegisterPage />
          </PublicOnly>
        }
      />

      <Route path="/home" element={<Protected><HomePage /></Protected>} />
      <Route
        path="/perfil"
        element={<Protected><ProfilePage /></Protected>}
      />
      <Route
        path="/populares"
        element={<Protected><PopularPage /></Protected>}
      />
      <Route
        path="/notificaciones"
        element={<Protected><NotificationsPage /></Protected>}
      />
      {/* TS-09: biblioteca personal. react-router rankea los paths, así que el
          `/playlists/:id` no matchea el `/playlists` exacto sin importar el
          orden. */}
      <Route
        path="/playlists"
        element={<Protected><PlaylistsPage /></Protected>}
      />
      <Route
        path="/playlists/:id"
        element={<Protected><PlaylistDetailPage /></Protected>}
      />
      {/* Catálogo de discos: grilla paginada y detalle por id. */}
      <Route
        path="/albums"
        element={<Protected><AlbumsPage /></Protected>}
      />
      <Route
        path="/albums/:id"
        element={<Protected><AlbumDetailPage /></Protected>}
      />
      <Route
        path="/artistas"
        element={<Protected><ArtistsPage /></Protected>}
      />
      <Route
        path="/artistas/:id"
        element={<Protected><ArtistDetailPage /></Protected>}
      />
      {/* TS-17/TS-16: listado de salas con buscador y orden por calificación del
          anfitrión. TS-14 agrega crear la sala y su pantalla: ambas detrás de
          `Protected` porque el backend exige sesión hasta para leer el detalle. */}
      <Route path="/salas" element={<Protected><RoomsPage /></Protected>} />
      <Route path="/salas/crear" element={<Protected><CreateRoomPage /></Protected>} />
      <Route path="/salas/:id" element={<Protected><RoomPage /></Protected>} />
      {/* TS-20: recomendaciones por estado de ánimo. El detector se descarga
          cuando se entra a la pantalla, no al cargar la app. */}
      <Route path="/animo" element={<Protected><MoodPage /></Protected>} />
      <Route path="/buscar" element={<Protected><SearchPage /></Protected>} />
      {/* Listas de seguidores y seguidos (TS-10). Las del propio usuario van
          dentro de `Protected` porque dependen de la sesión; las de otra persona
          no, igual que el perfil público del que cuelgan. Cada ruta declara la
          relación como prop, así `/perfil/cualquiera` no matchea nada. */}
      <Route
        path="/perfil/seguidores"
        element={<Protected><FollowListPage relation="seguidores" /></Protected>}
      />
      <Route
        path="/perfil/siguiendo"
        element={<Protected><FollowListPage relation="siguiendo" /></Protected>}
      />
      {/* `/profile/:id` es el perfil público de otra persona (TS-08). Va fuera de
          `Protected` a propósito: es una vista de lectura y no debería depender
          de que haya sesión. */}
      <Route
        path="/profile/:id"
        element={<AppLayout><PublicProfilePage /></AppLayout>}
      />
      <Route
        path="/profile/:id/seguidores"
        element={<AppLayout><FollowListPage relation="seguidores" /></AppLayout>}
      />
      <Route
        path="/profile/:id/siguiendo"
        element={<AppLayout><FollowListPage relation="siguiendo" /></AppLayout>}
      />

      <Route path="/components" element={<Protected><ComponentsPage /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}