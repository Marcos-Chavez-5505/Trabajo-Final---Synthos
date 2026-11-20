-- CreateTable
CREATE TABLE "room_kicked" (
    "id_room" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "kicked_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_kicked_pkey" PRIMARY KEY ("id_room","id_user")
);

-- CreateIndex
CREATE INDEX "room_kicked_id_user_idx" ON "room_kicked"("id_user");

-- AddForeignKey
ALTER TABLE "room_kicked" ADD CONSTRAINT "room_kicked_id_room_fkey" FOREIGN KEY ("id_room") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_kicked" ADD CONSTRAINT "room_kicked_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
