import { useEffect, useState } from "react";
import {
	useAuth,
	useHomeSongs,
	useLatestAlbums,
	useNewArtists,
} from "@synthos/shared";
import { toastMessages } from "@/lib/toastMessages.js";
import MediaCard from "@/components/cards/MediaCard.jsx";
import ArtistCard from "@/components/cards/ArtistCard.jsx";
import HomeSection from './HomeSection.jsx';
import { useNavigate } from "react-router-dom";
import AlbumCard from "@/components/cards/AlbumCard.jsx";

export default function HomeDesktop() {
	const [attempt, setAttempt] = useState(0);

	return (
		<HomeDesktopContent
			key={attempt}
			onRetry={() => setAttempt((value) => value + 1)}
		/>
	);
}

function HomeDesktopContent({ onRetry }) {
	const navigate = useNavigate();
	const { user } = useAuth();
	const {
		songs,
		error: songsError,
		loading: songsLoading,
		playSongs,
		addToQueue,
	} = useHomeSongs();
	const {
		artists,
		error: artistError,
		loading: artistLoading,
	} = useNewArtists();
	const {
		albums,
		error: albumError,
		loading: albumLoading,
	} = useLatestAlbums();

	useEffect(() => {
		if (songsError) toastMessages.homeSongsLoadError(songsError);
	}, [songsError]);

	useEffect(() => {
		if (artistError) toastMessages.homeArtistsLoadError(artistError);
	}, [artistError]);

	useEffect(() => {
		if (albumError) toastMessages.homeAlbumsLoadError(albumError);
	}, [albumError]);

	return (
		<div className="p-6 md:p-10 flex flex-col gap-4">
			<h1 className="Header2">Hola, {user?.username}</h1>

			{songsError ? (
				<SectionRetry title="Novedades" onRetry={onRetry} />
			) : (
				<HomeSection
					title="Novedades"
					loading={songsLoading}
					items={songs}
					skeleton={
						<div className="w-40 h-40 rounded-xl bg-muted animate-pulse shrink-0" />
					}
					renderItem={(song, index) => (
						<MediaCard
							title={song.title}
							artist={song.artist}
							label={song.genre}
							coverUrl={song.coverUrl}
							onPlay={() => playSongs(songs, index)}
							onAddToQueue={() => addToQueue(song)}
						/>
					)}
				/>
			)}

			{artistError ? (
				<SectionRetry title="Nuevos artistas" onRetry={onRetry} />
			) : (
				<HomeSection
					title="Nuevos artistas"
					loading={artistLoading}
					items={artists}
					skeleton={
						<div className="w-40 h-40 rounded-full bg-muted animate-pulse shrink-0" />
					}
					renderItem={(artist) => <ArtistCard artist={artist} />}
				/>
			)}

			{albumError ? (
				<SectionRetry title="Nuevos lanzamientos" onRetry={onRetry} />
			) : (
				<HomeSection
					title="Nuevos lanzamientos"
					loading={albumLoading}
					items={albums}
					skeleton={
						<div className="MiniMediaCardWidth aspect-square bg-muted animate-pulse shrink-0 CardRadius" />
					}
					renderItem={(album) => (
						<AlbumCard
							album={album}
							onClick={() => navigate(`/albums/${album.id}`)}
						/>
					)}
				/>
			)}
		</div>
	);
}

function SectionRetry({ title, onRetry }) {
	return (
		<section className="mt-10">
			<h2 className="Header4 mb-4">{title}</h2>
			<p className="text-muted-foreground TextRegluar">
				No hay contenido por ahora.
			</p>
			<button
				type="button"
				onClick={onRetry}
				className="TextRegluar Volume mt-3 rounded px-4 py-2"
			>
				Reintentar
			</button>
		</section>
	);
}
