// Carga el catálogo de Jamendo y sus letras.
// Es idempotente: se puede ejecutar varias veces sin duplicar canciones ni letras.
//
// JSON esperado: artista -> álbumes -> canciones.
// Cada canción puede incluir:
// lyrics: [{ text: "...", time: null }] para letra plana, o
// lyrics: [{ text: "...", time: 12.34 }, ...] para letra sincronizada.
//
// Los timestamps se guardan como milisegundos enteros.
// En el frontend se comparan con audio.currentTime * 1000.

const fs = require("fs");
const path = require("path");
const prisma = require("../src/prisma/prismaClient");

const DEFAULT_FILE = path.join(__dirname, "data", "songs.json");
const MOODS = ["neutral", "happy", "sad", "angry"];
const ALBUM_TYPES = ["single", "ep", "album"];

const clip = (value, max) =>
	String(value ?? "")
		.trim()
		.slice(0, max);

const toId = (value) => {
	const n = Number(value);
	return Number.isInteger(n) && n > 0 ? n : null;
};

const toDate = (value) => {
	if (!value) return null;

	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
};

const toText = (value) =>
	typeof value === "string" && value.trim() ? value.trim() : null;

function loadData(file) {
	if (!fs.existsSync(file)) {
		throw new Error(
			`No existe el archivo ${file}. Copiá ahí el JSON de jamendo_seed.html.`,
		);
	}

	const data = JSON.parse(fs.readFileSync(file, "utf8"));

	if (!Array.isArray(data)) {
		throw new Error("El JSON tiene que ser un array de artistas.");
	}

	return data;
}

function normalizeLyrics(song) {
	const entries = Array.isArray(song.lyrics) ? song.lyrics : [];

	const plainParts = [];
	const timedLines = [];

	for (const entry of entries) {
		const text = typeof entry?.text === "string" ? entry.text.trim() : "";

		if (!text) continue;

		const time = Number(entry?.time);

		if (
			entry?.time !== null &&
			entry?.time !== undefined &&
			Number.isFinite(time) &&
			time >= 0
		) {
			timedLines.push({
				text,
				timestampMs: Math.round(time * 1000),
			});
		} else {
			plainParts.push(text);
		}
	}

	// Ordenar las líneas sincronizadas por tiempo.
	timedLines.sort((a, b) => a.timestampMs - b.timestampMs);

	// Si la fuente proporciona texto sin timestamps, lo usamos.
	// Si no, construimos la letra completa desde las líneas sincronizadas.
	const plainText =
		plainParts.length > 0
			? plainParts.join("\n\n")
			: timedLines.length > 0
				? timedLines.map((line) => line.text).join("\n")
				: null;

	return {
		text: plainText,
		source: toText(song.lyrics_source),
		language: toText(song.musicinfo?.lang),
		isSynced: timedLines.length > 0,
		lines: timedLines,
	};
}

function createLookup(model) {
	const cache = new Map();

	return async (tx, rawName) => {
		const name = clip(rawName, 80);

		if (!name) return null;

		if (!cache.has(name)) {
			const row = await tx[model].upsert({
				where: { name },
				update: {},
				create: { name },
				select: { id: true },
			});

			cache.set(name, row.id);
		}

		return cache.get(name);
	};
}

async function saveLyrics(tx, idSong, song) {
	const normalized = normalizeLyrics(song);

	// Si no hay letra, eliminar el registro anterior si existe.
	if (!normalized.text && normalized.lines.length === 0) {
		await tx.lyrics.deleteMany({
			where: { idSong },
		});

		return;
	}

	// Guardar la letra completa, tenga o no sincronización.
	const lyrics = await tx.lyrics.upsert({
		where: { idSong },
		update: {
			text: normalized.text,
			source: normalized.source,
			language: normalized.language,
			isSynced: normalized.isSynced,
		},
		create: {
			idSong,
			text: normalized.text,
			source: normalized.source,
			language: normalized.language,
			isSynced: normalized.isSynced,
		},
		select: { id: true },
	});

	// Reemplazar las líneas para reflejar los timestamps actuales.
	await tx.karaokeLine.deleteMany({
		where: { idLyrics: lyrics.id },
	});

	// Guardar las líneas únicamente cuando tienen timestamps.
	if (normalized.lines.length > 0) {
		await tx.karaokeLine.createMany({
			data: normalized.lines.map((line, index) => ({
				idLyrics: lyrics.id,
				position: index,
				timestampMs: line.timestampMs,
				text: line.text,
			})),
		});
	}
}

async function main() {
	const file = path.resolve(DEFAULT_FILE);
	const artists = loadData(file);

	const getGenreId = createLookup("genre");
	const getMoodId = createLookup("mood");

	const summary = await prisma.$transaction(
		async (tx) => {
			const stats = {
				artists: 0,
				albums: 0,
				songs: 0,
				lyrics: 0,
				syncedSongs: 0,
				karaokeLines: 0,
				omitted: 0,
			};

			for (const artist of artists) {
				const idArtist = toId(artist.id);
				const name = clip(artist.name, 150);

				if (!idArtist || !name) {
					console.warn(`Artista omitido: ${JSON.stringify(artist.id)}`);
					stats.omitted++;
					continue;
				}

				const artistData = {
					name,
					pictureUrl: toText(artist.image_url),
				};

				await tx.artist.upsert({
					where: { id: idArtist },
					update: artistData,
					create: { id: idArtist, ...artistData },
				});

				stats.artists++;

				for (const album of artist.albums ?? []) {
					const idAlbum = toId(album.id);
					const albumName = clip(album.name, 200);

					if (!idAlbum || !albumName || !ALBUM_TYPES.includes(album.type)) {
						console.warn(`Álbum omitido: ${JSON.stringify(album.id)}`);
						stats.omitted++;
						continue;
					}

					const albumData = {
						name: albumName,
						idArtist,
						releaseDate: toDate(album.release_date),
						coverUrl: toText(album.cover_url),
						type: album.type,
					};

					await tx.album.upsert({
						where: { id: idAlbum },
						update: albumData,
						create: { id: idAlbum, ...albumData },
					});

					stats.albums++;

					for (const song of album.songs ?? []) {
						const idSong = toId(song.id);
						const title = clip(song.title, 200);
						const url = toText(song.url);

						if (!idSong || !title || !url) {
							console.warn(`Canción omitida: ${JSON.stringify(song.id)}`);
							stats.omitted++;
							continue;
						}

						const songData = {
							title,
							idArtist,
							idAlbum,
							releaseDate: toDate(song.release_date),
							coverUrl: toText(song.cover_url),
							duration: Number.isInteger(song.duration) ? song.duration : null,
							url,
						};

						await tx.song.upsert({
							where: { id: idSong },
							update: songData,
							create: { id: idSong, ...songData },
						});

						stats.songs++;

						const normalizedLyrics = normalizeLyrics(song);

						await saveLyrics(tx, idSong, song);

						if (normalizedLyrics.text || normalizedLyrics.lines.length > 0) {
							stats.lyrics++;
						}

						if (normalizedLyrics.isSynced) {
							stats.syncedSongs++;
							stats.karaokeLines += normalizedLyrics.lines.length;
						}

						// Géneros
						const genreNames = new Set(song.musicinfo?.tags?.genres ?? []);

						const genreIds = [];

						for (const genreName of genreNames) {
							const id = await getGenreId(tx, genreName);

							if (id) {
								genreIds.push(id);
							}
						}

						await tx.songGenre.deleteMany({
							where: { idSong },
						});

						await tx.songGenre.createMany({
							data: [...new Set(genreIds)].map((idGenre) => ({
								idSong,
								idGenre,
							})),
							skipDuplicates: true,
						});

						// Moods
						const moodIds = [];

						for (const mood of new Set(song.moods ?? [])) {
							if (!MOODS.includes(mood)) {
								console.warn(
									`Mood ignorado "${mood}" en canción ${idSong} (solo ${MOODS.join(", ")}).`,
								);
								continue;
							}

							const idMood = await getMoodId(tx, mood);

							if (idMood) {
								moodIds.push(idMood);
							}
						}

						await tx.songMood.deleteMany({
							where: { idSong },
						});

						await tx.songMood.createMany({
							data: moodIds.map((idMood) => ({
								idSong,
								idMood,
							})),
							skipDuplicates: true,
						});
					}
				}
			}

			return stats;
		},
		{ timeout: 5 * 60 * 1000 },
	);

	// Reajustar secuencias porque los IDs de Jamendo se insertan manualmente.
	for (const table of ["artist", "album", "song"]) {
		await prisma.$queryRawUnsafe(
			`SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "${table}"), 1))`,
		);
	}

	const [genres, moods] = await Promise.all([
		prisma.genre.count(),
		prisma.mood.count(),
	]);

	console.log("\n===== RESUMEN =====");
	console.log(`Archivo: ${file}`);
	console.log(`Artistas: ${summary.artists}`);
	console.log(`Álbumes: ${summary.albums}`);
	console.log(`Canciones: ${summary.songs}`);
	console.log(`Canciones con letras: ${summary.lyrics}`);
	console.log(`Canciones con letras sincronizadas: ${summary.syncedSongs}`);
	console.log(`Líneas de karaoke: ${summary.karaokeLines}`);
	console.log(`Géneros en la base: ${genres}`);
	console.log(`Moods en la base: ${moods}`);

	if (summary.omitted > 0) {
		console.log(
			`Omitidos por datos inválidos: ${summary.omitted} (ver avisos arriba).`,
		);
	}
}

main()
	.catch((err) => {
		console.error(`ARCHIVO LEÍDO: ${DEFAULT_FILE}`);
		console.error("\nError: se revirtió todo, no se guardó nada.");
		console.error(err);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
