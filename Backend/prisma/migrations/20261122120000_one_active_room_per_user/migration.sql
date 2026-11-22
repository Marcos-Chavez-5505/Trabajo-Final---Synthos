-- Una sola sala activa por usuario.
--
-- `room_member` pasa a contener solo membresías de salas activas. Al cerrar
-- una sala sus filas se borran (ver room.service.js), así que un índice único
-- sobre id_user garantiza la regla sin necesitar columnas denormalizadas ni
-- índices parciales que dependan del estado de otra tabla.

-- 1. Las membresías de salas cerradas no representan una sala actual.
DELETE FROM "room_member" rm
USING "room" r
WHERE r.id = rm.id_room AND r.status = 'cerrada';

-- 2. Un anfitrión no puede administrar más de una sala activa. Se conserva la
--    más reciente y se cierran las demás: no existe transferencia de anfitrión.
WITH ranked_hosts AS (
	SELECT
		rm.id_room,
		rm.id_user,
		ROW_NUMBER() OVER (
			PARTITION BY rm.id_user
			ORDER BY r.creation_date DESC, r.id DESC
		) AS position
	FROM "room_member" rm
	JOIN "room" r ON r.id = rm.id_room
	WHERE rm.role = 'host' AND r.status = 'activa'
)
UPDATE "room" r
SET status = 'cerrada'
FROM ranked_hosts rh
WHERE r.id = rh.id_room AND rh.position > 1;

-- 3. Esas salas recién cerradas ya no conservan membresías.
DELETE FROM "room_member" rm
USING "room" r
WHERE r.id = rm.id_room AND r.status = 'cerrada';

-- 4. Un usuario no puede estar en más de una sala activa. Se conserva la sala
--    que administra si existe; si no, la membresía más reciente.
WITH ranked_members AS (
	SELECT
		rm.id_room,
		rm.id_user,
		ROW_NUMBER() OVER (
			PARTITION BY rm.id_user
			ORDER BY
				CASE WHEN rm.role = 'host' THEN 0 ELSE 1 END,
				rm.join_date DESC,
				rm.id_room DESC
		) AS position
	FROM "room_member" rm
	JOIN "room" r ON r.id = rm.id_room
	WHERE r.status = 'activa'
)
DELETE FROM "room_member" rm
USING ranked_members rk
WHERE rm.id_room = rk.id_room
	AND rm.id_user = rk.id_user
	AND rk.position > 1;

-- 5. Restricción final: una fila de membresía por usuario.
CREATE UNIQUE INDEX "room_member_id_user_key" ON "room_member"("id_user");
