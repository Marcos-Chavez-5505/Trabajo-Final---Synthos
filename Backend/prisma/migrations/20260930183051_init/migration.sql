/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "playlist_type" AS ENUM ('personal', 'colab');

-- CreateEnum
CREATE TYPE "playlist_role" AS ENUM ('creator', 'colaborator');

-- CreateEnum
CREATE TYPE "room_role" AS ENUM ('host', 'member');

-- CreateEnum
CREATE TYPE "room_status" AS ENUM ('activa', 'cerrada');

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "picture_url" TEXT,
    "biography" TEXT,
    "registration_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,

    CONSTRAINT "artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "id_artist" INTEGER NOT NULL,
    "release_date" DATE,
    "cover_url" TEXT,
    "duration" INTEGER,
    "url" TEXT NOT NULL,

    CONSTRAINT "song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song_artist" (
    "id_song" INTEGER NOT NULL,
    "id_artist" INTEGER NOT NULL,

    CONSTRAINT "song_artist_pkey" PRIMARY KEY ("id_song","id_artist")
);

-- CreateTable
CREATE TABLE "genre" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,

    CONSTRAINT "genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song_genre" (
    "id_song" INTEGER NOT NULL,
    "id_genre" INTEGER NOT NULL,

    CONSTRAINT "song_genre_pkey" PRIMARY KEY ("id_song","id_genre")
);

-- CreateTable
CREATE TABLE "mood" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,

    CONSTRAINT "mood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "song_mood" (
    "id_song" INTEGER NOT NULL,
    "id_mood" INTEGER NOT NULL,

    CONSTRAINT "song_mood_pkey" PRIMARY KEY ("id_song","id_mood")
);

-- CreateTable
CREATE TABLE "playlist" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "id_creator" INTEGER NOT NULL,
    "type" "playlist_type" NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "token_invitation" VARCHAR(255),
    "creation_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_member" (
    "id_playlist" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "role" "playlist_role" NOT NULL,
    "join_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_member_pkey" PRIMARY KEY ("id_playlist","id_user")
);

-- CreateTable
CREATE TABLE "playlist_song" (
    "id_playlist" INTEGER NOT NULL,
    "id_song" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "added_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "added_by" INTEGER,

    CONSTRAINT "playlist_song_pkey" PRIMARY KEY ("id_playlist","id_song")
);

-- CreateTable
CREATE TABLE "favorite" (
    "id_user" INTEGER NOT NULL,
    "id_song" INTEGER NOT NULL,
    "marked_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_pkey" PRIMARY KEY ("id_user","id_song")
);

-- CreateTable
CREATE TABLE "follow" (
    "follower_id" INTEGER NOT NULL,
    "followed_id" INTEGER NOT NULL,
    "follow_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_pkey" PRIMARY KEY ("follower_id","followed_id")
);

-- CreateTable
CREATE TABLE "content" (
    "id" SERIAL NOT NULL,
    "id_author" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "id_song" INTEGER,
    "date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_playement" (
    "id_content" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,

    CONSTRAINT "content_playement_pkey" PRIMARY KEY ("id_content","id_user")
);

-- CreateTable
CREATE TABLE "room" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "id_playlist_source" INTEGER NOT NULL,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "password_hash" VARCHAR(255),
    "max_capacity" INTEGER NOT NULL,
    "status" "room_status" NOT NULL,
    "creation_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6),

    CONSTRAINT "room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_member" (
    "id_room" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "role" "room_role" NOT NULL,
    "join_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_member_pkey" PRIMARY KEY ("id_room","id_user")
);

-- CreateTable
CREATE TABLE "host_rating" (
    "id_room" INTEGER NOT NULL,
    "id_rater" INTEGER NOT NULL,
    "id_host" INTEGER NOT NULL,
    "rating" SMALLINT NOT NULL,
    "rating_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "host_rating_pkey" PRIMARY KEY ("id_room","id_rater","id_host")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "genre_name_key" ON "genre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "mood_name_key" ON "mood"("name");

-- CreateIndex
CREATE UNIQUE INDEX "room_code_key" ON "room"("code");

-- AddForeignKey
ALTER TABLE "song" ADD CONSTRAINT "song_id_artist_fkey" FOREIGN KEY ("id_artist") REFERENCES "artist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_artist" ADD CONSTRAINT "song_artist_id_song_fkey" FOREIGN KEY ("id_song") REFERENCES "song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_artist" ADD CONSTRAINT "song_artist_id_artist_fkey" FOREIGN KEY ("id_artist") REFERENCES "artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_genre" ADD CONSTRAINT "song_genre_id_song_fkey" FOREIGN KEY ("id_song") REFERENCES "song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_genre" ADD CONSTRAINT "song_genre_id_genre_fkey" FOREIGN KEY ("id_genre") REFERENCES "genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_mood" ADD CONSTRAINT "song_mood_id_song_fkey" FOREIGN KEY ("id_song") REFERENCES "song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "song_mood" ADD CONSTRAINT "song_mood_id_mood_fkey" FOREIGN KEY ("id_mood") REFERENCES "mood"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist" ADD CONSTRAINT "playlist_id_creator_fkey" FOREIGN KEY ("id_creator") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_member" ADD CONSTRAINT "playlist_member_id_playlist_fkey" FOREIGN KEY ("id_playlist") REFERENCES "playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_member" ADD CONSTRAINT "playlist_member_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_song" ADD CONSTRAINT "playlist_song_id_playlist_fkey" FOREIGN KEY ("id_playlist") REFERENCES "playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_song" ADD CONSTRAINT "playlist_song_id_song_fkey" FOREIGN KEY ("id_song") REFERENCES "song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_song" ADD CONSTRAINT "playlist_song_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_id_song_fkey" FOREIGN KEY ("id_song") REFERENCES "song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow" ADD CONSTRAINT "follow_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow" ADD CONSTRAINT "follow_followed_id_fkey" FOREIGN KEY ("followed_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_id_author_fkey" FOREIGN KEY ("id_author") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_id_song_fkey" FOREIGN KEY ("id_song") REFERENCES "song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_playement" ADD CONSTRAINT "content_playement_id_content_fkey" FOREIGN KEY ("id_content") REFERENCES "content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_playement" ADD CONSTRAINT "content_playement_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_id_playlist_source_fkey" FOREIGN KEY ("id_playlist_source") REFERENCES "playlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_member" ADD CONSTRAINT "room_member_id_room_fkey" FOREIGN KEY ("id_room") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_member" ADD CONSTRAINT "room_member_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_rating" ADD CONSTRAINT "host_rating_id_room_fkey" FOREIGN KEY ("id_room") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_rating" ADD CONSTRAINT "host_rating_id_rater_fkey" FOREIGN KEY ("id_rater") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_rating" ADD CONSTRAINT "host_rating_id_host_fkey" FOREIGN KEY ("id_host") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "host_rating" ADD CONSTRAINT "host_rating_rating_check" CHECK ("rating" BETWEEN 1 AND 5);

ALTER TABLE "follow" ADD CONSTRAINT "follow_no_self_follow_check" CHECK ("follower_id" <> "followed_id");