// Uso: node prisma/seedRooms.js
//
// Salas de prueba PERMANENTES para TS-17 (ordenar salas por calificación del
// anfitrión). Es idempotente: se puede volver a correr sin duplicar nada.
//
// Por qué un seed y no datos volados en el frontend: `GET /api/rooms?sort=rating`
// ordena por `host_avg_rating.avg_rating`, que es una VISTA sobre `host_rating`.
// Si la tabla no tiene filas, la vista devuelve `COALESCE(AVG(...), 0)` = 0 para
// toda sala y los dos criterios de orden dan exactamente la misma lista: la
// pantalla de TS-17 no se puede comprobar. Hace falta historial real de
// calificaciones.
//
// Relación con TS-11: el endpoint de calificar todavía no existe, así que las
// filas de `host_rating` se insertan directo por acá. Cuando TS-11 exponga
// `POST /rooms/:id/rate`, este archivo pasa a ser opcional y sus filas se crean
// usando la app.
//
// Estructura (por qué cada sala necesita lo que necesita):
//   user (anfitrión) → playlist (fuente) → room → host_rating
//
// `room.id_playlist_source` es NOT NULL con FK a `playlist`, así que no hay sala
// sin playlist. `host_rating` necesita las tres personas: el anfitrión, quien
// califica y la sala.
//
// La PK de `host_rating` es [id_room, id_rater, id_host]: una calificación por
// persona y sala. Los ratings repetidos del mismo `rater` a un mismo anfitrión se
// acumulan en filas distintas de salas distintas, que es el caso real.
//
// Canciones: `playlist_song.id_song` tiene FK a `song`, así que el seed NO fija
// IDs de canciones. Al arrancar toma las primeras canciones que existan en la
// base (el "pool") y cada sala referencia posiciones de ese pool (`songs: [0, 1]`).
// Así funciona en la base de cualquier integrante del equipo.

const bcrypt = require("bcryptjs");

const prisma = require("../src/prisma/prismaClient");

const SALT_ROUNDS = 10;
const SONG_POOL_SIZE = 6;

// ---------------------------------------------------------------------------
// Datos de prueba
// ---------------------------------------------------------------------------

const HOSTS = [
	{ email: "host.rock@example.com", username: "rock_total" },
	{ email: "host.jazz@example.com", username: "jazz_callejero" },
	{ email: "host.electro@example.com", username: "electro_pura" },
	{ email: "host.ambiente@example.com", username: "ambiente_total" },
	{ email: "host.pop@example.com", username: "pop_radiante" },
];

const RATERS = [
	{ email: "rater.uno@example.com", username: "uno_que_escucha" },
	{ email: "rater.dos@example.com", username: "dos_que_escucha" },
	{ email: "rater.tres@example.com", username: "tres_que_escucha" },
];

// `songs` son posiciones dentro del pool de canciones existentes (0 = la primera).
const ROOMS = [
	{
		code: "ELECTRO404",
		name: "Electro 404",
		description: "Basses y hits de club, sin hablar mucho.",
		playlistName: "Electro 404 (fuente)",
		songs: [0, 1],
		host: "electro_pura",
		maxCapacity: 20,
		ratings: [5, 5, 5],
	},
	{
		code: "JAZZCALLE",
		name: "Jazz de la calle",
		description: "Standards y algo de free, volumen bajo.",
		playlistName: "Jazz de la calle (fuente)",
		songs: [2],
		host: "jazz_callejero",
		maxCapacity: 12,
		ratings: [5, 4, 4],
	},
	{
		code: "ROCKTOTAL",
		name: "Rock total",
		description: "Guitarras y mucho volumen.",
		playlistName: "Rock total (fuente)",
		songs: [0, 3, 4],
		host: "rock_total",
		maxCapacity: 30,
		ratings: [4, 4, 3],
	},
	{
		code: "AMBIENTET",
		name: "Ambiente total",
		description: "Para escuchar sin mirar la pantalla.",
		playlistName: "Ambiente total (fuente)",
		songs: [1],
		host: "ambiente_total",
		maxCapacity: 8,
		ratings: [3, 2, 2],
	},
	{
		code: "POPRADIAN",
		name: "Pop radiante",
		description: "La sala que siempre pone la que todos quieren.",
		playlistName: "Pop radiante (fuente)",
		songs: [2, 3],
		host: "pop_radiante",
		maxCapacity: 15,
		ratings: [],
	},
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loadSongPool() {
	const songs = await prisma.song.findMany({
		select: { id: true },
		orderBy: { id: "asc" },
		take: SONG_POOL_SIZE,
	});

	if (songs.length === 0) {
		throw new Error(
			"No hay canciones en la tabla song. Cargá canciones antes de correr el seed.",
		);
	}

	return songs.map((s) => s.id);
}

// Convierte posiciones del pool en IDs reales y descarta repetidos
// (si el pool es chico, el módulo puede repetir una canción).
function resolveSongIds(positions, songPool) {
	const ids = positions.map((i) => songPool[i % songPool.length]);
	return [...new Set(ids)];
}

async function upsertUser(tx, { email, username }, passwordHash) {
	const user = await tx.user.upsert({
		where: { email },
		update: { username },
		create: { email, username, passwordHash },
		select: { id: true, username: true },
	});

	return user;
}

async function upsertPlaylist(tx, { name, creatorId, songIds }) {
	const existente = await tx.playlist.findFirst({
		where: { name, idCreator: creatorId },
		select: { id: true },
	});

	const playlist = existente
		? await tx.playlist.update({
				where: { id: existente.id },
				data: {
					description: "Playlist fuente de una sala de prueba (TS-17).",
					type: "colab",
					isPublic: true,
				},
				select: { id: true },
			})
		: await tx.playlist.create({
				data: {
					name,
					description: "Playlist fuente de una sala de prueba (TS-17).",
					idCreator: creatorId,
					type: "colab",
					isPublic: true,
				},
				select: { id: true },
			});

	for (const [position, idSong] of songIds.entries()) {
		await tx.playlistSong.upsert({
			where: { idPlaylist_idSong: { idPlaylist: playlist.id, idSong } },
			update: { position },
			create: {
				idPlaylist: playlist.id,
				idSong,
				position,
				addedBy: creatorId,
			},
		});
	}

	return playlist;
}

async function upsertRoom(tx, room, { hostId, playlistId }) {
	const record = await tx.room.upsert({
		where: { code: room.code },
		update: {
			name: room.name,
			description: room.description,
			idPlaylistSource: playlistId,
			maxCapacity: room.maxCapacity,
			status: "activa",
		},
		create: {
			code: room.code,
			name: room.name,
			description: room.description,
			idPlaylistSource: playlistId,
			isPrivate: false,
			maxCapacity: room.maxCapacity,
			status: "activa",
		},
		select: { id: true },
	});

	await tx.roomMember.upsert({
		where: { idRoom_idUser: { idRoom: record.id, idUser: hostId } },
		update: { role: "host" },
		create: { idRoom: record.id, idUser: hostId, role: "host" },
	});

	return record;
}

async function seedRatings(tx, { roomId, hostId, ratings, raterIds }) {
	for (const [index, rating] of ratings.entries()) {
		const raterId = raterIds[index % raterIds.length];

		await tx.hostRating.upsert({
			where: {
				idRoom_idRater_idHost: {
					idRoom: roomId,
					idRater: raterId,
					idHost: hostId,
				},
			},
			update: { rating },
			create: { idRoom: roomId, idRater: raterId, idHost: hostId, rating },
		});
	}
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	const passwordHash = await bcrypt.hash("Demo1234", SALT_ROUNDS);

	// Fuera de la transacción: solo lectura de canciones que ya existen.
	const songPool = await loadSongPool();
	console.log(`Pool de canciones (${songPool.length}): ${songPool.join(", ")}`);

	const resumen = await prisma.$transaction(
		async (tx) => {
			const hosts = new Map();
			for (const host of HOSTS) {
				const created = await upsertUser(tx, host, passwordHash);
				hosts.set(host.username, created.id);
			}

			const raters = [];
			for (const rater of RATERS) {
				raters.push(await upsertUser(tx, rater, passwordHash));
			}
			const raterIds = raters.map((r) => r.id);

			const salas = [];
			for (const room of ROOMS) {
				const hostId = hosts.get(room.host);
				if (!hostId) {
					throw new Error(
						`La sala ${room.code} no tiene anfitrión "${room.host}".`,
					);
				}

				const playlist = await upsertPlaylist(tx, {
					name: room.playlistName,
					creatorId: hostId,
					songIds: resolveSongIds(room.songs, songPool),
				});

				const record = await upsertRoom(tx, room, {
					hostId,
					playlistId: playlist.id,
				});

				await seedRatings(tx, {
					roomId: record.id,
					hostId,
					ratings: room.ratings,
					raterIds,
				});

				salas.push({
					code: room.code,
					name: room.name,
					ratings: room.ratings.length,
				});
			}

			return { hosts: hosts.size, raters: raterIds.length, salas };
		},
		{ timeout: 2 * 60 * 1000 },
	);

	console.log("\n===== RESUMEN =====");
	console.log(`Anfitriones:   ${resumen.hosts}`);
	console.log(`Calificadores: ${resumen.raters}`);
	console.log(`Salas:         ${resumen.salas.length}`);
	for (const sala of resumen.salas) {
		const detalle =
			sala.ratings === 0 ? "sin calificar" : `${sala.ratings} calificaciones`;
		console.log(`   - ${sala.name} (${sala.code}): ${detalle}`);
	}

	// Verificación con el mismo criterio de orden que usa el endpoint, para que
	// el seed deje claro qué tiene que verse en `/salas`.
	const ordenadas = await prisma.$queryRaw`
		SELECT
			room.name,
			COALESCE(host_avg_rating.avg_rating, 0) AS avg_rating
		FROM room
		JOIN room_member host_member
			ON host_member.id_room = room.id AND host_member.role = 'host'
		LEFT JOIN host_avg_rating
			ON host_avg_rating.id_host = host_member.id_user
		WHERE room.is_private = false
		ORDER BY avg_rating DESC, room.name ASC
	`;
	console.log("\nComo las va a devolver ?sort=rating:");
	for (const row of ordenadas) {
		const avg = Number(row.avg_rating);
		console.log(
			`   - ${row.name}: ${avg === 0 ? "sin calificar" : `${avg.toFixed(2)} / 5`}`,
		);
	}
}

main()
	.catch((err) => {
		console.error("\nError: se revirtió todo, no se guardó nada.");
		console.error(err);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
