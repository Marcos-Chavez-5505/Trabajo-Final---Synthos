-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('follow', 'recommendation', 'playlist_invitation');

-- CreateTable
CREATE TABLE "notification" (
    "id" SERIAL NOT NULL,
    "id_user" INTEGER NOT NULL,
    "id_actor" INTEGER NOT NULL,
    "type" "notification_type" NOT NULL,
    "id_song" INTEGER,
    "id_playlist" INTEGER,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_id_user_is_read_created_at_idx" ON "notification"("id_user", "is_read", "created_at");

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_id_actor_fkey" FOREIGN KEY ("id_actor") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_id_song_fkey" FOREIGN KEY ("id_song") REFERENCES "song"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_id_playlist_fkey" FOREIGN KEY ("id_playlist") REFERENCES "playlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;
