SELECT
  user_playlist.id_user,
  song_genre.id_genre,
  count(DISTINCT playlist_song.id_song) AS song_count
FROM
  (
    (
      (
        SELECT
          playlist.id_creator AS id_user,
          playlist.id AS id_playlist
        FROM
          playlist
        UNION
        SELECT
          playlist_member.id_user,
          playlist_member.id_playlist
        FROM
          playlist_member
      ) user_playlist
      JOIN playlist_song ON (
        (
          playlist_song.id_playlist = user_playlist.id_playlist
        )
      )
    )
    JOIN song_genre ON ((song_genre.id_song = playlist_song.id_song))
  )
GROUP BY
  user_playlist.id_user,
  song_genre.id_genre;