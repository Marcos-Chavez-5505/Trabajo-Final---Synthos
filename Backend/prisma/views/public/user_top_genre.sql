SELECT
  DISTINCT ON (user_genre_counts.id_user) user_genre_counts.id_user,
  user_genre_counts.id_genre,
  genre.name AS genre_name,
  user_genre_counts.song_count
FROM
  (
    user_genre_counts
    JOIN genre ON ((genre.id = user_genre_counts.id_genre))
  )
ORDER BY
  user_genre_counts.id_user,
  user_genre_counts.song_count DESC;