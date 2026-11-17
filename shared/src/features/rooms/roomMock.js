/**
 * MOCK TEMPORAL — datos que el backend todavía no envía (genres, members, isLive).
 *
 * Se borra cuando exista el plan de integración: bastará con quitar la llamada a
 * `withRoomMock` en el modelo, porque la tarjeta ya lee `room.genres`,
 * `room.members` y `room.isLive` tal como llegarán del backend.
 *
 * Los valores son deterministas (salen del id de la sala): la misma sala se ve
 * igual en cada render y entre recargas.
 */

const GENRES = [
  "Pop",
  "Rock",
  "Techno",
  "Indie",
  "Jazz",
  "Hip hop",
  "Lo-fi",
  "Reggaeton",
  "Salsa",
  "Electrónica",
];

const GUESTS = [
  "luna_beat",
  "nico.wav",
  "sofi_vinyl",
  "tomi_dj",
  "cami_synth",
  "mati_bass",
  "vale_groove",
  "fede_loop",
  "lau_remix",
];

function hash(value) {
  let h = 0;
  for (const char of String(value)) h = (h * 31 + char.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Completa solo lo que falte: si el backend ya envía un campo, se respeta.
 * `members` representa a los invitados, sin la anfitriona (ella se muestra aparte).
 */
export function withRoomMock(room) {
  const h = hash(room.id ?? room.name);

  const genres =
    room.genres ??
    [0, 1, 2].map((offset) => GENRES[(h + offset * 3) % GENRES.length]);

  const guestsCount = Math.max(0, (room.membersCount ?? 1) - 1);
  const members =
    room.members ??
    Array.from({ length: Math.min(guestsCount, GUESTS.length) }, (_, index) => ({
      id: `mock-${room.id}-${index}`,
      username: GUESTS[(h + index) % GUESTS.length],
    }));

  return {
    ...room,
    isLive: room.isLive ?? h % 3 !== 0,
    genres,
    members,
  };
}