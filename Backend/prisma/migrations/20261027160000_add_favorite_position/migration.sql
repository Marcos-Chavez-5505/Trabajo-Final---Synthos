-- AlterTable
ALTER TABLE "favorite" ADD COLUMN "position" INTEGER;

-- Backfill: el favorito más reciente primero (coherente con que las altas
-- nuevas entran al principio), con id_song como desempate determinista.
UPDATE "favorite" AS f
SET "position" = ranked.rn
FROM (
  SELECT
    "id_user",
    "id_song",
    ROW_NUMBER() OVER (
      PARTITION BY "id_user"
      ORDER BY "marked_date" DESC, "id_song" ASC
    ) - 1 AS rn
  FROM "favorite"
) AS ranked
WHERE f."id_user" = ranked."id_user"
  AND f."id_song" = ranked."id_song";

-- AlterTable
ALTER TABLE "favorite" ALTER COLUMN "position" SET NOT NULL;

-- CreateIndex
CREATE INDEX "playlist_song_id_playlist_position_idx" ON "playlist_song"("id_playlist", "position");

-- CreateIndex
CREATE INDEX "favorite_id_user_position_idx" ON "favorite"("id_user", "position");
