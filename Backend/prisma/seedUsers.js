// Uso: node prisma/seedUsers.js
//
// Usuarios de prueba y todo lo que nace de una acción de usuario: seguidores,
// favoritos, playlists (personales, colaborativas y de favoritos), miembros e
// invitaciones de playlists, recomendaciones de canciones en perfiles ajenos y
// membresías en salas. Es idempotente: se puede volver a correr sin duplicar
// nada.
//
// Orden: seed.js (música) → seedRooms.js → seedUsers.js.
//   - Necesita canciones en la base. Las elige por mood, ordenadas por id, así
//     que no depende de ids concretos de Jamendo.
//   - Las membresías en salas usan los códigos de seedRooms.js. Si una sala no
//     existe, se avisa y se omite.
//
// No toca lo que ya hace seedRooms.js: anfitriones, calificadores, salas y
// calificaciones (host_rating).
//
// Todos los usuarios entran con la contraseña de PASSWORD.

const bcrypt = require("bcryptjs");

const prisma = require("../src/prisma/prismaClient");

const SALT_ROUNDS = 10;
const PASSWORD = "Demo1234";

// Cada usuario tiene además una playlist de tipo "favorites" con las mismas
// canciones que sus filas de `favorite`. Poné false si tu app no la usa.
const CREATE_FAVORITES_PLAYLIST = true;
const FAVORITES_PER_USER = 5;

// ---------------------------------------------------------------------------
// Datos de prueba
// ---------------------------------------------------------------------------

// `taste` es el mood del que salen sus canciones favoritas.
const USERS = [
	{
		email: "ana.demo@example.com",
		username: "ana_sintoniza",
		taste: "happy",
		biography: "Arranco el día con música alegre.",
	},
	{
		email: "bruno.demo@example.com",
		username: "bruno_ritmo",
		taste: "sad",
		biography: "Playlists para días grises.",
	},
	{
		email: "cami.demo@example.com",
		username: "cami_acordes",
		taste: "neutral",
		biography: "Música para concentrarse.",
	},
	{
		email: "diego.demo@example.com",
		username: "diego_bajos",
		taste: "happy",
		biography: "Si no hay bajo, no es música.",
	},
	{
		email: "eli.demo@example.com",
		username: "eli_vinilo",
		taste: "sad",
		biography: "Coleccionista de baladas.",
	},
	{
		email: "fede.demo@example.com",
		username: "fede_playlist",
		taste: "neutral",
		biography: "Armo playlists para todo.",
	},
	{
		email: "gise.demo@example.com",
		username: "gise_melodia",
		taste: "happy",
		biography: "Cantante de ducha profesional.",
	},
	{
		email: "hugo.demo@example.com",
		username: "hugo_ecos",
		taste: "neutral",
		biography: null,
	},
];

// [quien sigue, a quién sigue]
const FOLLOWS = [
	["ana_sintoniza", "bruno_ritmo"],
	["ana_sintoniza", "cami_acordes"],
	["bruno_ritmo", "ana_sintoniza"],
	["bruno_ritmo", "cami_acordes"],
	["cami_acordes", "ana_sintoniza"],
	["cami_acordes", "diego_bajos"],
	["diego_bajos", "ana_sintoniza"],
	["eli_vinilo", "bruno_ritmo"],
	["fede_playlist", "gise_melodia"],
	["gise_melodia", "ana_sintoniza"],
	["hugo_ecos", "ana_sintoniza"],
	["hugo_ecos", "eli_vinilo"],
];

// Las canciones salen de las que tengan ese `mood`, ordenadas por id
// (`skip` y `take` permiten que cada playlist tenga canciones distintas).
// En las colaborativas, `invites` es [usuario, estado]: quien acepta pasa a ser
// miembro (colaborador); pendiente y rechazada solo dejan la invitación.
const PLAYLISTS = [
	{
		name: "Mañanas con energía",
		owner: "ana_sintoniza",
		type: "personal",
		isPublic: true,
		mood: "happy",
		skip: 0,
		take: 8,
	},
	{
		name: "Para días grises",
		owner: "bruno_ritmo",
		type: "personal",
		isPublic: false,
		mood: "sad",
		skip: 0,
		take: 8,
	},
	{
		name: "Foco total",
		owner: "cami_acordes",
		type: "personal",
		isPublic: true,
		mood: "neutral",
		skip: 0,
		take: 6,
	},
	{
		name: "Viernes de bajos",
		owner: "diego_bajos",
		type: "personal",
		isPublic: true,
		mood: "happy",
		skip: 10,
		take: 6,
	},
	{
		name: "Previa colaborativa",
		owner: "ana_sintoniza",
		type: "colab",
		isPublic: true,
		mood: "happy",
		skip: 20,
		take: 6,
		invites: [
			["bruno_ritmo", "aceptada"],
			["cami_acordes", "aceptada"],
			["diego_bajos", "aceptada"],
			["eli_vinilo", "pendiente"],
			["fede_playlist", "rechazada"],
		],
	},
	{
		name: "Lluvia y vinilos",
		owner: "eli_vinilo",
		type: "colab",
		isPublic: true,
		mood: "sad",
		skip: 10,
		take: 6,
		invites: [
			["bruno_ritmo", "aceptada"],
			["hugo_ecos", "aceptada"],
			["cami_acordes", "pendiente"],
		],
	},
	{
		name: "Sala de estudio",
		owner: "fede_playlist",
		type: "colab",
		isPublic: false,
		mood: "neutral",
		skip: 12,
		take: 6,
		invites: [
			["gise_melodia", "aceptada"],
			["hugo_ecos", "pendiente"],
		],
	},
];

// Recomendaciones de canciones en el perfil de otras personas. Cada una es un
// `content` (autor + texto + canción) y una fila de `content_playement` por
// destinatario. El autor solo ve las que hizo; el destinatario ve todas las
// que recibió. Nadie se recomienda a sí mismo.
const RECOMMENDATIONS = [
	{
		author: "ana_sintoniza",
		text: "Para arrancar la semana con otra energía.",
		song: { mood: "happy", skip: 0 },
		to: ["bruno_ritmo", "cami_acordes"],
	},
	{
		author: "bruno_ritmo",
		text: "Escuchala cuando quieras algo tranquilo.",
		song: { mood: "sad", skip: 2 },
		to: ["eli_vinilo"],
	},
	{
		author: "cami_acordes",
		text: "Ideal para concentrarte, sin distracciones.",
		song: { mood: "neutral", skip: 1 },
		to: ["ana_sintoniza", "fede_playlist", "hugo_ecos"],
	},
	{
		author: "diego_bajos",
		text: "Mirá este bajo, no vas a poder quedarte quieta.",
		song: { mood: "happy", skip: 3 },
		to: ["ana_sintoniza"],
	},
	{
		author: "eli_vinilo",
		text: "Esta me dejó pensando todo el día.",
		song: { mood: "sad", skip: 5 },
		to: ["bruno_ritmo", "hugo_ecos"],
	},
	{
		author: "fede_playlist",
		text: "Va perfecta con tu playlist de foco.",
		song: { mood: "neutral", skip: 6 },
		to: ["cami_acordes"],
	},
	{
		author: "gise_melodia",
		text: "No pude dejar de cantarla, tenías que escucharla.",
		song: { mood: "happy", skip: 7 },
		to: ["ana_sintoniza", "fede_playlist"],
	},
	{
		author: "hugo_ecos",
		text: "Me acordé de vos con esta.",
		song: { mood: "neutral", skip: 4 },
		to: ["ana_sintoniza"],
	},
];

// Se unen como `member`. El anfitrión de cada sala lo crea seedRooms.js.
const ROOM_MEMBERS = [
	{ code: "ROCKTOTAL", users: ["ana_sintoniza", "diego_bajos"] },
	{
		code: "ELECTRO404",
		users: ["gise_melodia", "fede_playlist", "cami_acordes"],
	},
	{ code: "JAZZCALLE", users: ["cami_acordes", "hugo_ecos"] },
	{ code: "AMBIENTET", users: ["bruno_ritmo", "eli_vinilo"] },
	{ code: "POPRADIAN", users: ["ana_sintoniza", "gise_melodia"] },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function idOf(map, username) {
	const id = map.get(username);
	if (!id)
		throw new Error(`El usuario "${username}" no está definido en USERS.`);
	return id;
}

async function pickSongs(tx, { mood, skip = 0, take = 5 }) {
	const rows = await tx.song.findMany({
		where: { songMoods: { some: { mood: { name: mood } } } },
		orderBy: { id: "asc" },
		skip,
		take,
		select: { id: true },
	});
	return rows.map((r) => r.id);
}

async function ensureMutualFollow(tx, users, user1, user2) {
	const idUser1 = idOf(users, user1);
	const idUser2 = idOf(users, user2);

	await tx.follow.upsert({
		where: {
			followerId_followedId: {
				followerId: idUser1,
				followedId: idUser2,
			},
		},
		update: {},
		create: {
			followerId: idUser1,
			followedId: idUser2,
		},
	});

	await tx.follow.upsert({
		where: {
			followerId_followedId: {
				followerId: idUser2,
				followedId: idUser1,
			},
		},
		update: {},
		create: {
			followerId: idUser2,
			followedId: idUser1,
		},
	});
}

async function upsertUser(tx, { email, username, biography }, passwordHash) {
	return tx.user.upsert({
		where: { email },
		update: { username, biography },
		create: { email, username, biography, passwordHash },
		select: { id: true, username: true },
	});
}

async function upsertPlaylist(
	tx,
	{ name, creatorId, type, isPublic, description, songIds, songAdders },
) {
	const existente = await tx.playlist.findFirst({
		where: { name, idCreator: creatorId },
		select: { id: true },
	});

	const data = { description, type, isPublic };
	const playlist = existente
		? await tx.playlist.update({
				where: { id: existente.id },
				data,
				select: { id: true },
			})
		: await tx.playlist.create({
				data: { name, idCreator: creatorId, ...data },
				select: { id: true },
			});

	// El creador siempre es miembro con rol "creator".
	await tx.playlistMember.upsert({
		where: {
			idPlaylist_idUser: { idPlaylist: playlist.id, idUser: creatorId },
		},
		update: { role: "creator" },
		create: { idPlaylist: playlist.id, idUser: creatorId, role: "creator" },
	});

	for (const [position, idSong] of songIds.entries()) {
		const addedBy = songAdders[position % songAdders.length];
		await tx.playlistSong.upsert({
			where: { idPlaylist_idSong: { idPlaylist: playlist.id, idSong } },
			update: { position },
			create: { idPlaylist: playlist.id, idSong, position, addedBy },
		});
	}

	return playlist;
}

async function upsertContent(tx, { authorId, text, songId }) {
	const existente = await tx.content.findFirst({
		where: { idAuthor: authorId, text },
		select: { id: true },
	});

	if (existente) {
		return tx.content.update({
			where: { id: existente.id },
			data: { idSong: songId },
			select: { id: true },
		});
	}
	return tx.content.create({
		data: { idAuthor: authorId, text, idSong: songId },
		select: { id: true },
	});
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

	const resumen = await prisma.$transaction(
		async (tx) => {
			if ((await tx.song.count()) === 0) {
				throw new Error(
					"No hay canciones en la base. Corré primero el seed de música.",
				);
			}

			const stats = {
				users: 0,
				follows: 0,
				favorites: 0,
				playlists: 0,
				invitations: 0,
				recommendations: 0,
				recipients: 0,
				roomMembers: 0,
				warnings: [],
			};

			// Usuarios
			const users = new Map();
			for (const u of USERS) {
				const created = await upsertUser(tx, u, passwordHash);
				users.set(created.username, created.id);
				stats.users++;
			}

			// Seguidores
			for (const [follower, followed] of FOLLOWS) {
				const followerId = idOf(users, follower);
				const followedId = idOf(users, followed);
				await tx.follow.upsert({
					where: { followerId_followedId: { followerId, followedId } },
					update: {},
					create: { followerId, followedId },
				});
				stats.follows++;
			}

			// Favoritos (+ playlist de tipo "favorites" con las mismas canciones)
			for (const [index, u] of USERS.entries()) {
				const idUser = idOf(users, u.username);
				const songIds = await pickSongs(tx, {
					mood: u.taste,
					skip: index * 3,
					take: FAVORITES_PER_USER,
				});

				for (const idSong of songIds) {
					await tx.favorite.upsert({
						where: { idUser_idSong: { idUser, idSong } },
						update: {},
						create: { idUser, idSong },
					});
					stats.favorites++;
				}

				if (CREATE_FAVORITES_PLAYLIST) {
					await upsertPlaylist(tx, {
						name: "Favoritas",
						creatorId: idUser,
						type: "favorites",
						isPublic: false,
						description: "Canciones marcadas como favoritas.",
						songIds,
						songAdders: [idUser],
					});
					stats.playlists++;
				}
			}

			// Playlists, miembros e invitaciones
			for (const p of PLAYLISTS) {
				const creatorId = idOf(users, p.owner);
				const songIds = await pickSongs(tx, p);
				const accepted = (p.invites ?? [])
					.filter(([, status]) => status === "aceptada")
					.map(([username]) => idOf(users, username));

				const playlist = await upsertPlaylist(tx, {
					name: p.name,
					creatorId,
					type: p.type,
					isPublic: p.isPublic,
					description: "Playlist de prueba creada por el seed de usuarios.",
					songIds,
					songAdders: [creatorId, ...accepted],
				});
				stats.playlists++;

				for (const [username, status] of p.invites ?? []) {
					const idReceiver = idOf(users, username);
					await tx.playlistInvitation.upsert({
						where: {
							idPlaylist_idReceiver: { idPlaylist: playlist.id, idReceiver },
						},
						update: { idSender: creatorId, status },
						create: {
							idPlaylist: playlist.id,
							idSender: creatorId,
							idReceiver,
							status,
						},
					});
					stats.invitations++;

					if (status === "aceptada") {
						await tx.playlistMember.upsert({
							where: {
								idPlaylist_idUser: {
									idPlaylist: playlist.id,
									idUser: idReceiver,
								},
							},
							update: { role: "colaborator" },
							create: {
								idPlaylist: playlist.id,
								idUser: idReceiver,
								role: "colaborator",
							},
						});
					}
				}
			}

			// Recomendaciones de canciones (autor → destinatarios)
			for (const r of RECOMMENDATIONS) {
				if (r.to.includes(r.author)) {
					throw new Error(
						`${r.author} no puede recomendarse una canción a sí mismo.`,
					);
				}
				const authorId = idOf(users, r.author);
				const [songId] = await pickSongs(tx, { ...r.song, take: 1 });
				if (!songId) {
					stats.warnings.push(
						`Sin canciones con mood "${r.song.mood}" para la recomendación de ${r.author}.`,
					);
					continue;
				}

				const content = await upsertContent(tx, {
					authorId,
					text: r.text,
					songId,
				});
				stats.recommendations++;

				for (const username of r.to) {
					const idUser = idOf(users, username);

					await ensureMutualFollow(tx, users, r.author, username);

					await tx.contentPlayement.upsert({
						where: {
							idContent_idUser: {
								idContent: content.id,
								idUser,
							},
						},
						update: {},
						create: {
							idContent: content.id,
							idUser,
						},
					});

					stats.recipients++;
				}
			}

			// Membresías en salas (si la sala no existe, se avisa)
			// for (const r of ROOM_MEMBERS) {
			// 	const room = await tx.room.findUnique({
			// 		where: { code: r.code },
			// 		select: { id: true },
			// 	});
			// 	if (!room) {
			// 		stats.warnings.push(
			// 			`La sala ${r.code} no existe: corré seedRooms.js antes.`,
			// 		);
			// 		continue;
			// 	}
			// 	for (const username of r.users) {
			// 		const idUser = idOf(users, username);
			// 		await tx.roomMember.upsert({
			// 			where: { idRoom_idUser: { idRoom: room.id, idUser } },
			// 			update: {},
			// 			create: { idRoom: room.id, idUser, role: "member" },
			// 		});
			// 		stats.roomMembers++;
			// 	}
			// }

			return stats;
		},
		{ timeout: 2 * 60 * 1000 },
	);

	console.log("\n===== RESUMEN =====");
	console.log(`Usuarios:                ${resumen.users}`);
	console.log(`Seguidores:              ${resumen.follows}`);
	console.log(`Favoritos:               ${resumen.favorites}`);
	console.log(`Playlists:               ${resumen.playlists}`);
	console.log(`Invitaciones:            ${resumen.invitations}`);
	console.log(`Recomendaciones:         ${resumen.recommendations}`);
	console.log(`Destinatarios (filas):   ${resumen.recipients}`);
	// console.log(`Miembros de sala:        ${resumen.roomMembers}`);
	for (const w of resumen.warnings) console.warn(`Aviso: ${w}`);

	console.log(`\nContraseña de todos los usuarios: ${PASSWORD}`);
	for (const u of USERS) console.log(`   - ${u.email} (${u.username})`);
}

main()
	.catch((err) => {
		console.error("\nError: se revirtió todo, no se guardó nada.");
		console.error(err);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());
