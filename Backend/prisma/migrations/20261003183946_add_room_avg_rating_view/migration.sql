CREATE VIEW room_avg_rating AS
SELECT
  room.id AS id_room,
  COALESCE(AVG(host_rating.rating), 0) AS avg_rating
FROM room
LEFT JOIN host_rating ON host_rating.id_room = room.id
GROUP BY room.id;