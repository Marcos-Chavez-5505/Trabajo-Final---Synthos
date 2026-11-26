// Copy de toasts compartido entre web y mobile. Datos puros: ni ids de toast,
// ni helpers, ni dependencias de React/React Native. Cada plataforma decide
// cuándo mostrarlo y con qué id.

export const TOAST_TITLES = {
	favoriteToggle: "No se pudo actualizar el favorito",
	playlistCoverRemove: "No se pudo quitar la portada",
	playlistCoverUpload: "No se pudo actualizar la portada",
	playlistCreate: "No se pudo crear la playlist",
	playlistDelete: "No se pudo eliminar la playlist",
	playlistInvitationAccept: "No se pudo aceptar la invitación",
	playlistInvitationReject: "No se pudo rechazar la invitación",
	playlistInvitationsLoad: "No se pudieron cargar las invitaciones",
	playlistInvite: "No se pudo enviar la invitación",
	playlistLoad: "No se pudo cargar la playlist",
	playlistMemberRemove: "No se pudo sacar al participante",
	playlistOrder: "No se pudo guardar el orden",
	playlistSongsLoad: "No se pudieron cargar las canciones",
	playlistUpdate: "No se pudo actualizar la playlist",
	profilePicture: "No se pudo subir la foto",
	profileSave: "No se pudo guardar el perfil",
	roomAction: "No se pudo completar la acción",
	roomClose: "No se pudo cerrar la sala",
	roomControl: "No se pudo controlar la reproducción",
	roomCreate: "No se pudo crear la sala",
	roomJoin: "No se pudo entrar a la sala",
	roomKick: "No se pudo sacar al participante",
	roomLeave: "No se pudo salir de la sala",
	roomLoad: "No se pudo cargar la sala",
	roomPlaySong: "No se pudo reproducir la canción",
	roomPlayback: "No se pudo sincronizar la reproducción",
	roomRate: "No se pudo enviar la calificación",
	roomVote: "No se pudo votar para saltar",
	songPlaylistAdd: "No se pudo agregar la canción",
	songRemove: "No se pudo quitar la canción",

	// Entradas nuevas de la auditoría de errores inline
	albumDetail: "No se pudo cargar el álbum",
	albumsLoad: "No se pudieron cargar los álbumes",
	artistDetail: "No se pudo cargar el artista",
	artistsLoad: "No se pudieron cargar los artistas",
	followListLoad: "No se pudo cargar la lista",
	followToggle: "No se pudo actualizar el seguimiento",
	homeAlbumsLoad: "No se pudieron cargar los lanzamientos",
	homeArtistsLoad: "No se pudieron cargar los artistas nuevos",
	homeSongsLoad: "No se pudieron cargar las novedades",
	login: "No se pudo iniciar sesión",
	moodSongs: "No se pudieron buscar las canciones",
	notificationsLoad: "No se pudieron cargar las notificaciones",
	playlistsLoad: "No se pudieron cargar las playlists",
	popularSongsLoad: "No se pudieron cargar los populares",
	profileEdit: "No se pudo guardar el perfil",
	profilePublicLoad: "No se pudo cargar el perfil",
	recommendationsLoad: "No se pudieron cargar las recomendaciones",
	recSong: "No se pudo enviar la recomendación",
	register: "No se pudo registrar",
	roomsLoad: "No se pudieron cargar las salas",
	searchAlbums: "No se pudo buscar álbumes",
	searchPeople: "No se pudo buscar personas",
	searchSongs: "No se pudo buscar canciones",
	songSearch: "No se pudo buscar la canción",
};

export const TOAST_COPY = {
	networkError:
		"No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.",
	roomAccessLost: {
		inactivity: {
			title: "Te sacamos de la sala",
			description:
				"La sala quedó inactiva y ya no tenés acceso. Te llevamos al listado de salas.",
		},
		kicked: {
			title: "Te sacaron de la sala",
			description:
				"El anfitrión te quitó de esta sala. Te llevamos al listado de salas.",
		},
		other_room: {
			title: "Cambiaste de sala",
			description:
				"Tu sesión ya no está en esta sala. Te llevamos al listado de salas.",
		},
		other: {
			title: "Ya no tenés acceso a la sala",
			description: "Te llevamos al listado de salas.",
		},
	},
	roomLeft: {
		host: {
			title: "Cerraste la sala",
			description: "Saliste y la sala dejó de estar disponible para el resto.",
		},
		private: {
			title: "Saliste de la sala",
			description: "Podés volver a entrar con el código.",
		},
		public: {
			title: "Saliste de la sala",
			description: "Podés volver a entrar desde el listado de salas.",
		},
	},
};
