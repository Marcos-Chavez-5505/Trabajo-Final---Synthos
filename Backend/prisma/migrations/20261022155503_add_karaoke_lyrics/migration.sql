-- CreateTable
CREATE TABLE "lyrics" (
    "id" SERIAL NOT NULL,
    "id_song" INTEGER NOT NULL,
    "text" TEXT,
    "source" VARCHAR(80),
    "language" VARCHAR(20),
    "is_synced" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lyrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "karaoke_line" (
    "id" SERIAL NOT NULL,
    "id_lyrics" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "timestamp_ms" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "karaoke_line_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lyrics_id_song_key" ON "lyrics"("id_song");

-- CreateIndex
CREATE INDEX "karaoke_line_id_lyrics_timestamp_ms_idx" ON "karaoke_line"("id_lyrics", "timestamp_ms");

-- CreateIndex
CREATE UNIQUE INDEX "karaoke_line_id_lyrics_position_key" ON "karaoke_line"("id_lyrics", "position");

-- AddForeignKey
ALTER TABLE "lyrics" ADD CONSTRAINT "lyrics_id_song_fkey" FOREIGN KEY ("id_song") REFERENCES "song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "karaoke_line" ADD CONSTRAINT "karaoke_line_id_lyrics_fkey" FOREIGN KEY ("id_lyrics") REFERENCES "lyrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
