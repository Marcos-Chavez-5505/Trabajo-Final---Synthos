export default function SongSearchStep({
	query,
	onQueryChange,
	items,
	loading,
	error,
	onPick,
}) {
	return (
		<div className="mt-4">
			<input
				autoFocus
				type="search"
				placeholder="Buscar canción o artista…"
				value={query}
				onChange={(e) => onQueryChange(e.target.value)}
				className="TextRegluar w-full rounded border border-border bg-transparent px-3 py-2"
			/>

			{loading && (
				<p className="TextTiny text-muted-foreground mt-3">Buscando…</p>
			)}

			{!loading && error && (
				<p className="TextTiny mt-3 text-red-500">{error}</p>
			)}

			{!loading && !error && query.trim() && items.length === 0 && (
				<p className="TextTiny text-muted-foreground mt-3">
					Sin resultados para “{query}”.
				</p>
			)}

			{!loading && !query.trim() && (
				<p className="TextTiny text-muted-foreground mt-3">
					Escribí para buscar una canción.
				</p>
			)}

			<ul className="mt-3 max-h-64 space-y-1 overflow-y-auto">
				{items.map((song) => (
					<li key={song.id}>
						<button
							type="button"
							onClick={() => onPick(song)}
							className="TextRegluar flex w-full items-center gap-3 rounded px-2 py-2 text-left hover:bg-black/5"
						>
							{song.coverUrl && (
								<img
									src={song.coverUrl}
									alt=""
									className="h-10 w-10 rounded object-cover"
								/>
							)}
							<span className="min-w-0">
								<span className="block truncate">{song.title}</span>
								<span className="TextTiny text-muted-foreground block truncate">
									{song.artist}
								</span>
							</span>
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}
