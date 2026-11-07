// @synthos/shared — código de negocio compartido (sin DOM, sin CSS, sin router).

// services
export * from "./services/api.js";
export * from "./services/albumsService.js";
export * from "./services/artistsService.js";
export * from "./services/authService.js";
export * from "./services/notificationsService.js";
export * from "./services/playlistsService.js";
export * from "./services/recommendationService.js";
export * from "./services/roomsService.js";
export * from "./services/socketService.js";
export * from "./services/songsService.js";
export { SEARCH_PAGE_SIZE as USERS_SEARCH_PAGE_SIZE } from "./services/usersService.js";
export {
	getUserById,
	searchUsers,
	updateProfile,
	uploadProfilePicture,
	subscribeToFollow,
	getFollowCounts,
	followStatus,
	listFollowing,
	listFollowers,
	followUser,
	unfollowUser,
} from "./services/usersService.js";

// context
export * from "./context/authContext.js";
export { default as AuthProvider } from "./context/AuthContext.jsx";
export * from "./context/playerContext.js";
export * from "./context/playerTimeContext.js";
export { default as PlayerProvider } from "./context/PlayerContext.jsx";
export * from "./context/recommendationContext.jsx";
export * from "./context/NotificationsContext.jsx";
export { NotificationsProvider } from "./context/NotificationsContext.jsx";

// hooks transversales
export { default as useAuth } from "./hooks/useAuth.js";
export { default as useDebounce } from "./hooks/useDebounce.js";
export { default as useFavorites } from "./features/playlists/hooks/useFavorites.js";
export { default as usePlayer } from "./hooks/usePlayer.js";
export { default as usePlayerTime } from "./hooks/usePlayerTime.js";
export { default as useRecommendation } from "./hooks/useRecommendation.js";
export { default as useSongSearch } from "./features/search/hooks/useSongsSearch.js";

// utils
export * from "./utils/mapError.js";
export * from "./utils/formatTime.js";
export { default as buildPageRange } from "./utils/pageRange.js";

// tokens
export * from "./tokens/tokens.js";

// icons
export * from "./icons/icons.js";

// feature hooks
export { default as usePopularSongs } from "./features/popular/hooks/usePopularSongs.js";
export { default as useHomeSongs } from "./features/home/hooks/useHomeSongs.js";
export { default as useNewArtists } from "./features/home/hooks/useHomeArtists.js";
export { default as useLatestAlbums } from "./features/home/hooks/useHomeAlbums.js";
export { default as useRoomsList } from "./features/rooms/hooks/useRoomsList.js";
export { default as useMoodSongs } from "./features/mood/hooks/useMoodSongs.js";
export { default as useAlbums } from "./features/albums/hooks/useAlbums.js";
export { default as usePlaylistsPage } from "./features/playlists/hooks/usePlaylistsPage.js";
export { default as useProfilePublic } from "./features/profile/hooks/useProfilePublic.js";
export { default as useProfileEdit } from "./features/profile/hooks/useProfileEdit.js";
export { default as useProfileView } from "./features/profile/hooks/useProfileView.js";
export { default as useFollowList } from "./features/social/hooks/useFollowList.js";
export { default as useSearchSongs } from "./features/search/hooks/useSearchSongs.js";
export { default as useSearchPeople } from "./features/search/hooks/useSearchPeople.js";
export { default as useSearchAlbums } from "./features/search/hooks/useSearchAlbums.js";
export { default as useLogin } from "./features/auth/hooks/useLogin.js";
export { default as useRegister } from "./features/auth/hooks/useRegister.js";
export { default as useArtists } from "./features/artists/hooks/useArtists.js";
export { default as useArtistDetail } from "./features/artists/hooks/useArtistDetail.js";
export { default as usePlaylistList } from "./features/playlists/hooks/usePlaylistList.js";
export { default as useSongPlaylists } from "./features/playlists/hooks/useSongPlaylists.js";
export { resolvePlaylistCoverUrl } from "./features/playlists/lib/playlistCover.js";
export { default as useReorderSongs } from "./features/playlists/hooks/useReorderSongs.js";
export { REORDER_DEBOUNCE_MS } from "./features/playlists/lib/reorderConfig.js";
export { default as useMyRooms } from "./features/rooms/hooks/useMyRooms.js";
export { default as useRoomPlayback } from "./features/rooms/hooks/useRoomPlayback.js";
export { default as useFollow } from "./features/social/hooks/useFollow.js";
export { default as useNotifications } from "./features/notifications/hooks/useNotifications.js";
