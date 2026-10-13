DROP VIEW IF EXISTS room_avg_rating;

CREATE VIEW host_avg_rating AS
SELECT
  host_rating.id_host AS id_host,
  COALESCE(AVG(host_rating.rating), 0) AS avg_rating
FROM host_rating
GROUP BY host_rating.id_host;