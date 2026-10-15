-- CreateEnum
CREATE TYPE "invitation_status" AS ENUM ('pendiente', 'aceptada', 'rechazada');

-- CreateTable
CREATE TABLE "playlist_invitation" (
    "id_playlist" INTEGER NOT NULL,
    "id_sender" INTEGER NOT NULL,
    "id_receiver" INTEGER NOT NULL,
    "status" "invitation_status" NOT NULL DEFAULT 'pendiente',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "playlist_invitation_pkey" PRIMARY KEY ("id_playlist","id_receiver")
);

-- AddForeignKey
ALTER TABLE "playlist_invitation" ADD CONSTRAINT "playlist_invitation_id_playlist_fkey" FOREIGN KEY ("id_playlist") REFERENCES "playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_invitation" ADD CONSTRAINT "playlist_invitation_id_sender_fkey" FOREIGN KEY ("id_sender") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_invitation" ADD CONSTRAINT "playlist_invitation_id_receiver_fkey" FOREIGN KEY ("id_receiver") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
