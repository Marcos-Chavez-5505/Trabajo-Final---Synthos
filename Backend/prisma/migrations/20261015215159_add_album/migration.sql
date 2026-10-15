/*
  Warnings:

  - Added the required column `id_album` to the `song` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "album_type" AS ENUM ('single', 'ep', 'album');

-- AlterTable
ALTER TABLE "artist" ADD COLUMN     "picture_url" TEXT;

-- AlterTable
ALTER TABLE "song" ADD COLUMN     "id_album" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "album" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "id_artist" INTEGER NOT NULL,
    "release_date" DATE,
    "cover_url" TEXT,
    "type" "album_type" NOT NULL,

    CONSTRAINT "album_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "album_id_artist_idx" ON "album"("id_artist");

-- CreateIndex
CREATE INDEX "song_id_album_idx" ON "song"("id_album");

-- AddForeignKey
ALTER TABLE "album" ADD CONSTRAINT "album_id_artist_fkey" FOREIGN KEY ("id_artist") REFERENCES "artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song" ADD CONSTRAINT "song_id_album_fkey" FOREIGN KEY ("id_album") REFERENCES "album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
