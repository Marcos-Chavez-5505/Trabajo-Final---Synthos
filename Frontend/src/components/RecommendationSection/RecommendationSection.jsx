import { Link } from "react-router-dom";
import Avatar from "../ui/Avatar.jsx";
import usePlayer from "../../hooks/usePlayer.js";
import { useRecommendationContext } from "../../context/recommendationContext.jsx";

export default function RecommendationSection({ emptyMessage }) {
	const { items, loading, error, retry } = useRecommendationContext();
	const { song: currentSong, isPlaying, playSongs, togglePlay } = usePlayer();

	if (loading) {
		return (
			<div className="mt-6 space-y-3">
				{[0, 1, 2].map((i) => (
					<div
						key={i}
						className="SurfaceLight CardRadius animate-pulse p-4"
						aria-hidden="true"
					>
						<div className="h-4 w-1/3 rounded bg-black/10" />
						<div className="mt-2 h-3 w-2/3 rounded bg-black/10" />
					</div>
				))}
				<p className="sr-only">Cargando recomendaciones…</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="SurfaceLight CardRadius mt-6 p-4">
				<p className="TextRegluar text-muted-foreground">{error}</p>
				<button
					type="button"
					onClick={retry}
					className="TextRegluar Volume mt-3 rounded px-4 py-2"
				>
					Reintentar
				</button>
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<p className="TextRegluar text-muted-foreground mt-6">
				{emptyMessage ?? "Todavía no hay recomendaciones por acá."}
			</p>
		);
	}

	// Los ids del backend son number y los del storage string, así que comparar
	// con String() evita el falso negativo que ya cubre `sameSong` en el player.
	const isCurrent = (songId) => String(currentSong?.id) === String(songId);

	const handlePlay = (song) => {
		// Si ya es la que suena, es toggle: pausar/reanudar sin recargar la cola.
		if (isCurrent(song.id)) {
			togglePlay();
			return;
		}

		// Canción suelta: cola de uno, sin origen. `null` como source es lo
		// mismo que usa el catálogo y la búsqueda, así que ninguna acción de
		// sincronización (removeFromPlaylistQueue, etc.) la va a tocar.
		playSongs([song], 0, null);
	};

	return (
		<ul className="mt-6 space-y-3">
			{items.map((rec) => (
				<li
					key={rec.id}
					className="CardRadius border border-border bg-black/5 p-4"
				>
					<Link
						to={`/profile/${rec.author?.id}`}
						className="flex items-center gap-3 hover:opacity-80"
					>
						<Avatar
							src={rec.author?.avatarUrl}
							name={rec.author?.username}
							className="h-10 w-10"
						/>
						<div className="min-w-0">
							<p className="TextMedium truncate">
								{rec.author?.username ?? "Alguien"}
							</p>
							<p className="TextTiny text-muted-foreground">
								{formatDate(rec.date)}
							</p>
						</div>
					</Link>

					<p className="TextRegluar mt-3">{rec.text}</p>

					{rec.song && (
						<div className="mt-3 flex items-center gap-3">
							{rec.song.coverUrl && (
								<img
									src={rec.song.coverUrl}
									alt=""
									className="h-12 w-12 rounded object-cover"
								/>
							)}
							<div className="min-w-0 flex-1">
								<p className="TextMedium truncate">{rec.song.title}</p>
								<p className="TextTiny text-muted-foreground truncate">
									{rec.song.artist}
								</p>
							</div>
							<button
								type="button"
								onClick={() => handlePlay(rec.song)}
								aria-label={
									isCurrent(rec.song.id) && isPlaying
										? `Pausar ${rec.song.title}`
										: `Reproducir ${rec.song.title}`
								}
								className="CardRadius Volume flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
							>
								{isCurrent(rec.song.id) && isPlaying ? "❚❚" : "▶"}
							</button>
						</div>
					)}
				</li>
			))}
		</ul>
	);
}

function formatDate(value) {
	if (!value) return "";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString("es-AR", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}
