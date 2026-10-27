-- CreateTable
CREATE TABLE "reorder_event" (
    "id" SERIAL NOT NULL,
    "id_user" INTEGER NOT NULL,
    "list_type" "playlist_type" NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reorder_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reorder_event_id_user_created_at_idx" ON "reorder_event"("id_user", "created_at");

-- CreateIndex
CREATE INDEX "reorder_event_list_type_created_at_idx" ON "reorder_event"("list_type", "created_at");

-- AddForeignKey
ALTER TABLE "reorder_event" ADD CONSTRAINT "reorder_event_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
