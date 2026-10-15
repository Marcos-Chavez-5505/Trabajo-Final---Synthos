// Uso: node prisma/seedMusic.js [ruta/al/archivo.json]
//
// Carga el catálogo de música (artistas, álbumes, canciones, géneros y moods) a
// partir del JSON que genera jamendo_seed.html. Es idempotente: se puede volver
// a correr sin duplicar nada.
//
// Formato esperado del JSON (todo anidado):
//   [ { id, name, image_url, albums: [ { id, name, release_date, cover_url, type,
//       songs: [ { id, title, release_date, cover_url, duration, url, moods,
//                  musicinfo: { tags: { genres: [] } } } ] } ] } ]
//
// Los ids de Jamendo se guardan tal cual como id de artista, álbum y canción.
// Es a propósito: seedRooms.js arma las playlists con ids de canciones de
// Jamendo (43886, 306166, etc.). Como los ids se insertan a mano, al final se
// reajustan las secuencias de autoincrement para que los próximos INSERT de la
// app no choquen con ellos.
//
// Orden: primero este archivo, después seedRooms.js.
//
// Los campos shorturl/shareurl del JSON se ignoran (no están en el schema).

const fs = require("fs");
const path = require("path");

const prisma = require("../src/prisma/prismaClient");

const DEFAULT_FILE = path.join(__dirname, "data", "songs.json");
const MOODS = ["neutral", "happy", "sad"];
const ALBUM_TYPES = ["single", "ep", "album"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
		throw new Error(
			"El JSON tiene que ser un array de artistas (artista → álbumes → canciones).",
		);
	}
	return data;
}

// Cachés para no repetir upserts de géneros y moods (se buscan por nombre).
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	const file = path.resolve(DEFAULT_FILE);
	const artists = loadData(file);

	const getGenreId = createLookup("genre");
	const getMoodId = createLookup("mood");

	const resumen = await prisma.$transaction(
		async (tx) => {
			const stats = { artists: 0, albums: 0, songs: 0, omitidos: 0 };

			for (const artist of artists) {
				const idArtist = toId(artist.id);
				const name = clip(artist.name, 150);
				if (!idArtist || !name) {
					console.warn(
						`Artista omitido (sin id o nombre): ${JSON.stringify(artist.id)}`,
					);
					stats.omitidos++;
					continue;
				}

				const artistData = { name, pictureUrl: toText(artist.image_url) };
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
						console.warn(
							`Álbum omitido (id, nombre o tipo inválido): ${JSON.stringify(album.id)}`,
						);
						stats.omitidos++;
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
							console.warn(
								`Canción omitida (sin id, título o url): ${JSON.stringify(song.id)}`,
							);
							stats.omitidos++;
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

						// Géneros y moods: se reemplazan los vínculos de la canción para
						// que volver a correr el seed deje exactamente lo del JSON.
						const genreNames = new Set(song.musicinfo?.tags?.genres ?? []);
						const genreIds = [];
						for (const g of genreNames) {
							const id = await getGenreId(tx, g);
							if (id) genreIds.push(id);
						}
						await tx.songGenre.deleteMany({ where: { idSong } });
						await tx.songGenre.createMany({
							data: [...new Set(genreIds)].map((idGenre) => ({
								idSong,
								idGenre,
							})),
							skipDuplicates: true,
						});

						const moodIds = [];
						for (const m of new Set(song.moods ?? [])) {
							if (!MOODS.includes(m)) {
								console.warn(
									`Mood ignorado "${m}" en la canción ${idSong} (solo ${MOODS.join(", ")}).`,
								);
								continue;
							}
							moodIds.push(await getMoodId(tx, m));
						}
						await tx.songMood.deleteMany({ where: { idSong } });
						await tx.songMood.createMany({
							data: moodIds.map((idMood) => ({ idSong, idMood })),
							skipDuplicates: true,
						});
					}
				}
			}

			return stats;
		},
		{ timeout: 5 * 60 * 1000 },
	);

	// Los ids se insertaron a mano: la secuencia de autoincrement no avanza sola.
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
	console.log(`Archivo:    ${file}`);
	console.log(`Artistas:   ${resumen.artists}`);
	console.log(`Álbumes:    ${resumen.albums}`);
	console.log(`Canciones:  ${resumen.songs}`);
	console.log(`Géneros en la base: ${genres}`);
	console.log(`Moods en la base:   ${moods}`);
	if (resumen.omitidos > 0) {
		console.log(
			`Omitidos por datos inválidos: ${resumen.omitidos} (ver avisos arriba)`,
		);
	}
}

main()
	.catch((err) => {
		console.log(`ARCHIVO LEIDO: ${DEFAULT_FILE}`);
		console.error("\nError: se revirtió todo, no se guardó nada.");
		console.error(err);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
