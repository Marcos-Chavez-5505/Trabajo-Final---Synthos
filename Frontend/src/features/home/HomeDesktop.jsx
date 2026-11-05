import { useAuth, useHomeSongs } from "@synthos/shared";
import MediaCard from "../../components/cards/MediaCard.jsx";
import ArtistCard from "../../components/cards/ArtistCard.jsx";
import useNewArtists from "@synthos/shared/src/features/home/useHomeArtists.jsx";

export default function HomeDesktop() {
	const { user } = useAuth();
	const { songs, error: songsError, playSongs, addToQueue } = useHomeSongs();
	const { artists, artistError, loading: artistLoading } = useNewArtists();

	console.log(artists);

	return (
		<div className="p-6 md:p-10">
			<h1 className="Header2">Hola, {user?.username}</h1>

			<section className="mt-10">
				<h2 className="Header4 mb-4">Novedades</h2>

				{songsError ? (
					<p className="text-muted-foreground TextRegular">
						No pudimos cargar las novedades.
					</p>
				) : (
					<ul className="flex gap-4 overflow-x-auto pb-1 scrollbar-thin">
						{songs.map((song, index) => (
							<li key={song.id}>
								<MediaCard
									title={song.title}
									artist={song.artist}
									label={song.genre}
									coverUrl={song.coverUrl}
									onPlay={() => playSongs(songs, index)}
									onAddToQueue={() => addToQueue(song)}
								/>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="mt-10">
				<h2 className="Header4 mb-4">Nuevos artistas</h2>

				{artistLoading ? (
					<ul className="flex gap-4 overflow-x-auto pb-1 scrollbar-thin">
						{Array.from({ length: 6 }).map((_, i) => (
							<li
								key={i}
								className="w-40 h-40 rounded-full bg-muted animate-pulse shrink-0"
							/>
						))}
					</ul>
				) : artistError ? (
					<p className="text-muted-foreground TextRegular">
						No pudimos cargar los artistas.
					</p>
				) : artists.length === 0 ? null : (
					<ul className="flex gap-4 overflow-x-auto pb-1 scrollbar-thin">
						{artists.map((artist) => (
							<li key={artist.id}>
								<ArtistCard artist={artist} />
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	);
}
