CREATE VIEW user_genre_counts AS
SELECT
  user_playlist.id_user,
  song_genre.id_genre,
  COUNT(DISTINCT playlist_song.id_song) AS song_count
FROM (
  SELECT id_creator AS id_user, id AS id_playlist FROM playlist
  UNION
  SELECT id_user, id_playlist FROM playlist_member
) AS user_playlist
JOIN playlist_song ON playlist_song.id_playlist = user_playlist.id_playlist
JOIN song_genre ON song_genre.id_song = playlist_song.id_song
GROUP BY user_playlist.id_user, song_genre.id_genre;

CREATE VIEW user_top_genre AS
SELECT DISTINCT ON (id_user)
  id_user,
  id_genre,
  song_count
FROM user_genre_counts
ORDER BY id_user, song_count DESC;