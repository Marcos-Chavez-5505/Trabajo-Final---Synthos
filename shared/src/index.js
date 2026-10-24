// @synthos/shared — código de negocio compartido (sin DOM, sin CSS, sin router).

// services
export * from './services/api.js'
export * from './services/albumsService.js'
export * from './services/artistsService.js'
export * from './services/authService.js'
export * from './services/notificationsService.js'
export * from './services/playlistsService.js'
export * from './services/recommendationService.js'
export * from './services/roomsService.js'
export * from './services/socketService.js'
export * from './services/songsService.js'
export { SEARCH_PAGE_SIZE as USERS_SEARCH_PAGE_SIZE } from './services/usersService.js'
export { getUserById, searchUsers, updateProfile, uploadProfilePicture, subscribeToFollow, getFollowCounts, followStatus, listFollowing, listFollowers, followUser, unfollowUser } from './services/usersService.js'

// context
export * from './context/authContext.js'
export { default as AuthProvider } from './context/AuthContext.jsx'
export * from './context/playerContext.js'
export { default as PlayerProvider } from './context/PlayerContext.jsx'
export * from './context/recommendationContext.jsx'
export * from './context/NotificationsContext.jsx'
export { NotificationsProvider } from './context/NotificationsContext.jsx'

// hooks
export { default as useAuth } from './hooks/useAuth.js'
export { default as useDebounce } from './hooks/useDebounce.js'
export { default as useFavorites } from './hooks/useFavorites.js'
export { default as usePlayer } from './hooks/usePlayer.js'
export { default as useRecommendation } from './hooks/useRecommendation.jsx'
export { default as useSongSearch } from './hooks/useSongsSearch.jsx'

// utils
export * from './utils/mapError.js'
export * from './utils/formatTime.js'
export { default as buildPageRange } from './utils/pageRange.js'
export * from './utils/sidebarMotion.js'

// tokens
export * from './tokens/tokens.js'

// feature hooks
export { default as usePopularSongs } from './features/popular/usePopularSongs.js'
export { default as useHomeSongs } from './features/home/useHomeSongs.js'
export { default as useRoomsList } from './features/rooms/useRoomsList.js'
export { default as useMoodSongs } from './features/mood/useMoodSongs.js'
export { default as useAlbums } from './features/albums/useAlbums.js'
export { default as usePlaylistsPage } from './features/playlists/usePlaylistsPage.js'
export { default as useProfilePublic } from './features/profile/useProfilePublic.js'
export { default as useProfileEdit } from './features/profile/useProfileEdit.js'
export { default as useProfileView } from './features/profile/useProfileView.js'
export { default as useFollowList } from './features/social/useFollowList.js'
export { default as useSearchSongs } from './features/search/useSearchSongs.js'
export { default as useSearchPeople } from './features/search/useSearchPeople.js'
export { default as useSearchAlbums } from './features/search/useSearchAlbums.js'
export { default as useLogin } from './features/auth/useLogin.js'
export { default as useRegister } from './features/auth/useRegister.js'
export { default as useArtists } from './features/artists/useArtists.js'
export { default as useArtistDetail } from './features/artists/useArtistDetail.js'
export { default as usePlaylistList } from './features/playlists/usePlaylistList.js'
export { default as useSongPlaylists } from './features/playlists/useSongPlaylists.js'
export { default as useMyRooms } from './features/rooms/useMyRooms.js'
export { default as useRoomPlayback } from './features/rooms/useRoomPlayback.js'
export { default as useFollow } from './features/social/useFollow.js'
export { default as useNotifications } from './features/notifications/useNotifications.js'