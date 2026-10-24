// @synthos/shared — código de negocio compartido (sin DOM, sin CSS, sin router).

// services
export * from './services/api.js'
export * from './services/albumsService.js'
export * from './services/artistsService.js'
export * from './services/authService.js'
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

// feature hooks
export { default as usePopularSongs } from './features/popular/usePopularSongs.js'
export { default as usePlaylistList } from './features/playlists/usePlaylistList.js'
export { default as useSongPlaylists } from './features/playlists/useSongPlaylists.js'
export { default as useMyRooms } from './features/rooms/useMyRooms.js'
export { default as useRoomPlayback } from './features/rooms/useRoomPlayback.js'
export { default as useFollow } from './features/social/useFollow.js'