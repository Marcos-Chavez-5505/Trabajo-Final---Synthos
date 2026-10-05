// Uso: node prisma/seedRooms.js
//
// Salas de prueba PERMANENTES para TS-17 (ordenar salas por calificación del
// anfitrión). Es idempotente: se puede volver a correr sin duplicar nada.
//
// Por qué un seed y no datos volados en el frontend: `GET /api/rooms?sort=rating`
// ordena por `room_avg_rating.avg_rating`, que es una VISTA sobre `host_rating`.
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
// accumulating en filas distintas de salas distintas, que es el caso real.

const bcrypt = require("bcryptjs");

const prisma = require("../src/prisma/prismaClient");

const SALT_ROUNDS = 10;

// ---------------------------------------------------------------------------
// Datos de prueba
// ---------------------------------------------------------------------------

// Anfitriones. Los passwords son todos "Demo1234" (el mismo que usa
// `mocks/users.js` en el frontend) y van hasheados con bcrypt, igual que
// `auth.service.js`. Son cuentas reales de la base: se puede iniciar sesión con
// cualquiera para ver la sala desde adentro.
const HOSTS = [
	{ email: "host.rock@example.com", username: "rock_total" },
	{ email: "host.jazz@example.com", username: "jazz_callejero" },
	{ email: "host.electro@example.com", username: "electro_pura" },
	{ email: "host.ambiente@example.com", username: "ambiente_total" },
	{ email: "host.pop@example.com", username: "pop_radiante" },
];

// Quienes califican. No son anfitriones de ninguna sala: su único rol en estos
// datos es ser `id_rater`, para que el promedio tenga más de una fuente y el
// orden por rating sea un promedio de verdad y no el mismo número repetido.
const RATERS = [
	{ email: "rater.uno@example.com", username: "uno_que_escucha" },
	{ email: "rater.dos@example.com", username: "dos_que_escucha" },
	{ email: "rater.tres@example.com", username: "tres_que_escucha" },
];

// Salas. Los ratings van en `ratings: [5, 4, 4]` y se combinan con `RATERS` en
// ese orden para producir las filas de `host_rating`.
//
// El test manual es: con "Mejor calificado" el promedio tiene que estar ordenado
// de mayor a menor, y con "Alfabético" por nombre, y las dos listas tienen que
// ser DISTINTAS. Los `ratings` de cada sala están elegidos para que eso se vea:
// alfabéticamente empiezan por "Ambiente total" (peor calificada) y el mejor
// promedio es "Electro 404", que va fourth alfabético.
const ROOMS = [
	{
		code: "ELECTRO404",
		name: "Electro 404",
		description: "Basses yhits de club, sin hablar mucho.",
		playlistName: "Electro 404 (fuente)",
		songs: [43886, 306166],
		host: "electro_pura",
		maxCapacity: 20,
		// Promedio 5,00 — la sala mejor calificada.
		ratings: [5, 5, 5],
	},
	{
		code: "JAZZCALLE",
		name: "Jazz de la calle",
		description: "Standards y algo de free, volumen bajo.",
		playlistName: "Jazz de la calle (fuente)",
		songs: [25706],
		host: "jazz_callejero",
		maxCapacity: 12,
		// Promedio 4,33
		ratings: [5, 4, 4],
	},
	{
		code: "ROCKTOTAL",
		name: "Rock total",
		description: "Guitarras y mucho volumen.",
		playlistName: "Rock total (fuente)",
		songs: [26747, 81740, 43886],
		host: "rock_total",
		maxCapacity: 30,
		// Promedio 3,67
		ratings: [4, 4, 3],
	},
	{
		code: "AMBIENTET",
		name: "Ambiente total",
		description: "Para escuchar sin mirar la pantalla.",
		playlistName: "Ambiente total (fuente)",
		songs: [306166],
		host: "ambiente_total",
		maxCapacity: 8,
		// Promedio 2,33
		ratings: [3, 2, 2],
	},
	{
		code: "POPRADIAN",
		name: "Pop radiante",
		description: "La sala que siempre pone la que todos quieren.",
		playlistName: "Pop radiante (fuente)",
		songs: [25706, 26747],
		host: "pop_radiante",
		maxCapacity: 15,
		// Sin calificaciones a propósito: la vista `room_avg_rating` lo tiene que
		// resolver a 0 con su `COALESCE`, y la pantalla tiene que mostrar "Sin
		// calificar" en vez de "0". Si se rompe el COALESCE, esta sala aparece
		// con `null` o desaparece del `JOIN` y el seed sirve de alarma.
		ratings: [],
	},
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// `upsert` por el campo único en vez de `create` + `findFirst`: dos corridas del
// seed no rompen nada y no hay que buscar a mano el id que se insertó la
// primera vez.
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
	const playlist = await tx.playlist.upsert({
		where: { name },
		update: {},
		create: {
			name,
			description: "Playlist fuente de una sala de prueba (TS-17).",
			idCreator: creatorId,
			type: "colab",
			isPublic: true,
		},
		select: { id: true },
	});

	// `playlist_song` tiene PK [id_playlist, id_song] y `position` es NOT NULL:
	// hay que upsertear las canciones una por una para poderles dar posición.
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

	// El anfitrión tiene que estar en `room_member` con role `host`: es lo que
	// lo convierte en anfitrión de la sala (y lo que TS-11 va a leer para
	// deshabilitar que se califique a sí mismo).
	await tx.roomMember.upsert({
		where: { idRoom_idUser: { idRoom: record.id, idUser: hostId } },
		update: { role: "host" },
		create: { idRoom: record.id, idUser: hostId, role: "host" },
	});

	return record;
}

// Las calificaciones se dan de alta por PK compuesta, así que `upsert` las hace
// idempotentes sin borrar el historial existente.
async function seedRatings(tx, { roomId, hostId, ratings, raterIds }) {
	for (const [index, rating] of ratings.entries()) {
		// Los ratings se reparten entre los raters. Si hay más ratings que
		// raters, un rater repite en otra combinación de sala; acá, con 3 de
		// cada, el reparto es uno a uno.
		const raterId = raterIds[index % raterIds.length];

		await tx.hostRating.upsert({
			where: {
				idRoom_idRater_idHost: { idRoom: roomId, idRater: raterId, idHost: hostId },
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

	const resumen = await prisma.$transaction(
		async (tx) => {
			// 1) Personas. Los anfitriones primero: son los creadores de las
			//    playlists fuente.
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

			// 2) Salas: playlist fuente → room → memberships → calificaciones.
			const salas = [];
			for (const room of ROOMS) {
				const hostId = hosts.get(room.host);
				if (!hostId) {
					throw new Error(`La sala ${room.code} no tiene anfitrión "${room.host}".`);
				}

				const playlist = await upsertPlaylist(tx, {
					name: room.playlistName,
					creatorId: hostId,
					songIds: room.songs,
				});

				const record = await upsertRoom(tx, room, { hostId, playlistId: playlist.id });

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
		SELECT room.name, room_avg_rating.avg_rating
		FROM room
		JOIN room_avg_rating ON room_avg_rating.id_room = room.id
		ORDER BY room_avg_rating.avg_rating DESC
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