-- CreateIndex
CREATE INDEX "room_status_idx" ON "room"("status");

-- CreateIndex
CREATE INDEX "room_is_private_idx" ON "room"("is_private");

-- CreateIndex
CREATE INDEX "room_name_idx" ON "room"("name");

-- Prisma no modela CHECK, así que va a mano. El mismo check ya estaba escrito en
-- src/db/schema.sql desde el inicio, pero algunas bases lo tienen aplicado por
-- fuera de las migraciones: se tira primero para que esta migración funcione
-- en todas.
ALTER TABLE "host_rating"
    DROP CONSTRAINT IF EXISTS "host_rating_rating_check";

ALTER TABLE "host_rating"
    ADD CONSTRAINT "host_rating_rating_check" CHECK ("rating" BETWEEN 1 AND 5);
