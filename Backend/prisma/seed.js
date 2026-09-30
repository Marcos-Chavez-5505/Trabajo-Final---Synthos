// Uso: node prisma/seedSongs.js [ruta/al/archivo.json]
// Por defecto lee prisma/data/songs.json
//
// Puebla SOLO las tablas del modelo de SYNTHOS que tienen datos en el JSON:
//   artist, song, genre, mood, song_artist, song_genre, song_mood
// Cualquier campo del JSON que no exista en la base se ignora.
// Las canciones sin género o sin mood se descartan.

const fs = require("node:fs");
const path = require("node:path");

const prisma = require("../src/prisma/prismaClient");

const inputPath = "prisma/data/songs.json";

// ---------- helpers ----------

const clean = (v) => (typeof v === "string" ? v.trim() : v);

// Lista de tags normalizada: trim + minúsculas + sin duplicados + sin vacíos
const normalizeList = (list, maxLen) => [
	...new Set(
		(Array.isArray(list) ? list : [])
			.map((x) => String(x).trim().toLowerCase().slice(0, maxLen))
			.filter(Boolean),
	),
];

const chunk = (arr, size = 1000) => {
	const out = [];
	for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
	return out;
};

function loadSongs(file) {
	const raw = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
	if (Array.isArray(raw)) return raw;
	if (Array.isArray(raw?.results)) return raw.results;
	throw new Error(
		"El JSON debe ser un array de canciones (o un objeto con 'results').",
	);
}

// Devuelve { song } si es válida, o { reason } si hay que ignorarla
function parseSong(s) {
	const id = Number(s.id);
	const idArtist = Number(s.id_artist);
	const title = clean(s.title);
	const artistName = clean(s.artist_name);
	const url = clean(s.url);

	const genres = normalizeList(s.musicinfo?.tags?.genres, 80);
	const moods = normalizeList(s.moods, 80);

	if (!genres.length) return { reason: "sin género" };
	if (!moods.length) return { reason: "sin mood" };

	// Campos NOT NULL de la base
	if (
		!Number.isInteger(id) ||
		!Number.isInteger(idArtist) ||
		!title ||
		!artistName ||
		!url
	) {
		return { reason: "faltan datos obligatorios (id, título, artista o url)" };
	}

	let releaseDate = null;
	if (s.release_date) {
		const d = new Date(s.release_date);
		if (!Number.isNaN(d.getTime())) releaseDate = d;
	}

	const duration =
		s.duration == null ||
		s.duration === "" ||
		!Number.isFinite(Number(s.duration))
			? null
			: Math.round(Number(s.duration));

	return {
		song: {
			id,
			title: title.slice(0, 200),
			idArtist,
			artistName: artistName.slice(0, 150),
			releaseDate,
			coverUrl: clean(s.cover_url) || null,
			duration,
			url,
			genres,
			moods,
		},
	};
}

// ---------- main ----------

async function main() {
	const rawSongs = loadSongs(inputPath);
	console.log(`Leídas ${rawSongs.length} canciones de ${inputPath}`);

	// 1) Validar y descartar
	const skipped = {};
	const valid = new Map(); // id -> canción (evita repetidos dentro del mismo JSON)
	let duplicatesInFile = 0;

	for (const raw of rawSongs) {
		const { song, reason } = parseSong(raw);
		if (!song) {
			skipped[reason] = (skipped[reason] ?? 0) + 1;
		} else if (valid.has(song.id)) {
			duplicatesInFile++;
		} else {
			valid.set(song.id, song);
		}
	}
	const songs = [...valid.values()];

	// 2) Insertar todo en una sola transacción (si algo falla, no queda nada a medias)
	const { added, alreadyExisting, genreCount, moodCount } =
		await prisma.$transaction(
			async (tx) => {
				// Artistas (se conserva el id de origen para mantener la relación)
				const artists = new Map(songs.map((s) => [s.idArtist, s.artistName]));
				for (const part of chunk(
					[...artists].map(([id, name]) => ({ id, name })),
				)) {
					await tx.artist.createMany({ data: part, skipDuplicates: true });
				}

				// Géneros y moods únicos
				const genreNames = [...new Set(songs.flatMap((s) => s.genres))];
				const moodNames = [...new Set(songs.flatMap((s) => s.moods))];

				await tx.genre.createMany({
					data: genreNames.map((name) => ({ name })),
					skipDuplicates: true,
				});
				await tx.mood.createMany({
					data: moodNames.map((name) => ({ name })),
					skipDuplicates: true,
				});

				const genreId = new Map(
					(await tx.genre.findMany()).map((g) => [g.name, g.id]),
				);
				const moodId = new Map(
					(await tx.mood.findMany()).map((m) => [m.name, m.id]),
				);

				// Canciones que todavía no están en la base
				const existingIds = new Set(
					(await tx.song.findMany({ select: { id: true } })).map((s) => s.id),
				);
				const toAdd = songs.filter((s) => !existingIds.has(s.id));

				for (const part of chunk(toAdd)) {
					await tx.song.createMany({
						data: part.map((s) => ({
							id: s.id,
							title: s.title,
							idArtist: s.idArtist,
							releaseDate: s.releaseDate,
							coverUrl: s.coverUrl,
							duration: s.duration,
							url: s.url,
						})),
						skipDuplicates: true,
					});
				}

				// Relaciones
				const songArtists = toAdd.map((s) => ({
					idSong: s.id,
					idArtist: s.idArtist,
				}));
				const songGenres = toAdd.flatMap((s) =>
					s.genres.map((g) => ({ idSong: s.id, idGenre: genreId.get(g) })),
				);
				const songMoods = toAdd.flatMap((s) =>
					s.moods.map((m) => ({ idSong: s.id, idMood: moodId.get(m) })),
				);

				for (const part of chunk(songArtists))
					await tx.songArtist.createMany({ data: part, skipDuplicates: true });
				for (const part of chunk(songGenres))
					await tx.songGenre.createMany({ data: part, skipDuplicates: true });
				for (const part of chunk(songMoods))
					await tx.songMood.createMany({ data: part, skipDuplicates: true });

				// Como insertamos ids explícitos en columnas autoincrementales, hay que
				// adelantar las secuencias para que los próximos INSERT no choquen.
				for (const table of ["artist", "song", "genre", "mood"]) {
					await tx.$queryRawUnsafe(
						`SELECT setval(pg_get_serial_sequence('${table}', 'id'),
                         COALESCE(MAX(id), 1), MAX(id) IS NOT NULL)
           FROM ${table}`,
					);
				}

				return {
					added: toAdd.length,
					alreadyExisting: songs.length - toAdd.length,
					genreCount: genreNames.length,
					moodCount: moodNames.length,
				};
			},
			{ timeout: 10 * 60 * 1000, maxWait: 30 * 1000 },
		);

	// ---------- resumen ----------
	const totalSkipped = Object.values(skipped).reduce((a, b) => a + b, 0);

	console.log("\n===== RESUMEN =====");
	console.log(`Canciones leídas:            ${rawSongs.length}`);
	console.log(`Canciones añadidas:          ${added}`);
	console.log(`Ya existían en la base:      ${alreadyExisting}`);
	console.log(`Repetidas dentro del JSON:   ${duplicatesInFile}`);
	console.log(`Ignoradas:                   ${totalSkipped}`);
	for (const [why, n] of Object.entries(skipped)) {
		console.log(`   - ${why}: ${n}`);
	}
	console.log(`Géneros distintos usados:    ${genreCount}`);
	console.log(`Moods distintos usados:      ${moodCount}`);
}

main()
	.catch((err) => {
		console.error("\nError: se revirtió todo, no se guardó nada.");
		console.error(err);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
