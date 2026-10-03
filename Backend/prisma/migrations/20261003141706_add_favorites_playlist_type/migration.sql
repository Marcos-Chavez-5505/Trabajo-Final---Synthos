-- AlterEnum
ALTER TYPE "playlist_type" ADD VALUE 'favorites';

-- Índice único parcial: un solo playlist de tipo 'favorites' por usuario
CREATE UNIQUE INDEX "uniq_favorites_playlist_per_user"
  ON "playlist" ("id_creator")
  WHERE "type" = 'favorites';
