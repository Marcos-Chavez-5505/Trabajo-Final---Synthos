import { useAuth, useHomeSongs } from "@synthos/shared";
import MediaCard from "../../components/cards/MediaCard.jsx";
import ArtistCard from "../../components/cards/ArtistCard.jsx";
import useNewArtists from "@synthos/shared/src/features/home/useHomeArtists.jsx";
import HomeSection from "../../components/home/HomeSection.jsx";

export default function HomeDesktop() {
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

	return (
		<div className="p-6 md:p-10 flex flex-col gap-4">
			<h1 className="Header2">Hola, {user?.username}</h1>

			<HomeSection
				title="Novedades"
				loading={songsLoading}
				error={songsError}
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

			<HomeSection
				title="Nuevos artistas"
				loading={artistLoading}
				error={artistError}
				items={artists}
				skeleton={
					<div className="w-40 h-40 rounded-full bg-muted animate-pulse shrink-0" />
				}
				renderItem={(artist) => <ArtistCard artist={artist} />}
			/>
		</div>
	);
}
