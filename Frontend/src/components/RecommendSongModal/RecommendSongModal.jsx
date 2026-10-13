import { useEffect, useMemo, useState } from "react";
import useSongSearch from "../../hooks/useSongsSearch";
import { useRecommendationContext } from "../../context/recommendationContext.jsx";
import SongSearchStep from "../SongSearchStep/SongSearchStep.jsx";

const MAX_TEXT = 280;
const DEFAULT_TEXT = "Te va a encantar esta canción";

export default function RecommendSongModal({ onClose, onSent }) {
	const [query, setQuery] = useState("");
	const [selectedSong, setSelectedSong] = useState(null);
	const [text, setText] = useState(DEFAULT_TEXT);

	const {
		items,
		loading: loadingSongs,
		error: searchError,
	} = useSongSearch(query);
	const { send, submitting, sendError, reset } = useRecommendationContext();

	useEffect(() => {
		reset();
	}, [selectedSong, text, reset]);

	const canSubmit = useMemo(
		() => !!selectedSong && text.trim().length > 0 && !submitting,
		[selectedSong, text, submitting],
	);

	const handleSubmit = async () => {
		if (!canSubmit) return;

		const result = await send({
			songId: selectedSong.id,
			text: text.trim(),
		});

		if (result.ok) {
			onSent?.(result.data);
			onClose?.();
		}
	};

	const handleClear = () => {
		setSelectedSong(null);
		setText(DEFAULT_TEXT);
		setQuery("");
		reset();
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			onClick={onClose}
		>
			<div
				className="SurfaceLight CardRadius w-full max-w-md p-6"
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
			>
				<header className="flex items-center justify-between">
					<h3 className="Header3">Recomendar canción</h3>
					<button
						type="button"
						onClick={onClose}
						aria-label="Cerrar"
						className="TextMedium text-muted-foreground"
					>
						×
					</button>
				</header>

				{!selectedSong ? (
					<SongSearchStep
						query={query}
						onQueryChange={setQuery}
						items={items}
						loading={loadingSongs}
						error={searchError}
						onPick={setSelectedSong}
					/>
				) : (
					<div className="mt-4">
						<div className="flex items-center gap-3">
							{selectedSong.coverUrl && (
								<img
									src={selectedSong.coverUrl}
									alt=""
									className="h-14 w-14 rounded object-cover"
								/>
							)}
							<div className="min-w-0">
								<strong className="TextMedium block truncate">
									{selectedSong.title}
								</strong>
								<span className="TextTiny text-muted-foreground block truncate">
									{selectedSong.artist}
								</span>
							</div>
							<button
								type="button"
								onClick={() => setSelectedSong(null)}
								className="TextTiny text-accent ml-auto"
							>
								Cambiar
							</button>
						</div>

						<label
							htmlFor="rec-text"
							className="TextTiny mt-4 block text-muted-foreground"
						>
							Tu mensaje
						</label>
						<textarea
							id="rec-text"
							value={text}
							maxLength={MAX_TEXT}
							rows={4}
							onChange={(e) => setText(e.target.value)}
							className="TextRegluar mt-1 w-full rounded border border-border bg-transparent px-3 py-2"
						/>
						<div className="TextTiny text-muted-foreground mt-1 text-right">
							{text.length}/{MAX_TEXT}
						</div>

						{sendError && (
							<p className="TextTiny mt-2 text-red-500">{sendError}</p>
						)}

						<footer className="mt-4 flex justify-end gap-2">
							<button
								type="button"
								onClick={handleClear}
								disabled={submitting}
								className="TextRegluar Volume rounded px-4 py-2"
							>
								Limpiar
							</button>
							<button
								type="button"
								onClick={handleSubmit}
								disabled={!canSubmit}
								className="TextRegluar Volume rounded px-4 py-2 disabled:opacity-50"
							>
								{submitting ? "Enviando…" : "Enviar recomendación"}
							</button>
						</footer>
					</div>
				)}
			</div>
		</div>
	);
}
