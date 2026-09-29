-- ============================================
-- SYNTHOS - Schema de base de datos (PostgreSQL)
-- ============================================

DROP TABLE IF EXISTS host_rating CASCADE;
DROP TABLE IF EXISTS room_member CASCADE;
DROP TABLE IF EXISTS room CASCADE;
DROP TABLE IF EXISTS content_playement CASCADE;
DROP TABLE IF EXISTS content CASCADE;
DROP TABLE IF EXISTS follow CASCADE;
DROP TABLE IF EXISTS favorite CASCADE;
DROP TABLE IF EXISTS playlist_song CASCADE;
DROP TABLE IF EXISTS playlist_member CASCADE;
DROP TABLE IF EXISTS playlist CASCADE;
DROP TABLE IF EXISTS song_mood CASCADE;
DROP TABLE IF EXISTS mood CASCADE;
DROP TABLE IF EXISTS song_genre CASCADE;
DROP TABLE IF EXISTS genre CASCADE;
DROP TABLE IF EXISTS song_artist CASCADE;
DROP TABLE IF EXISTS song CASCADE;
DROP TABLE IF EXISTS artist CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- ============================================
-- USER
-- ============================================
CREATE TABLE "user" (
    id               SERIAL PRIMARY KEY,
    email            VARCHAR(255) NOT NULL UNIQUE,
    username         VARCHAR(50)  NOT NULL UNIQUE,
    password_hash    VARCHAR(255) NOT NULL,
    picture_url      TEXT,
    biography        TEXT,
    registration_date TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- ARTIST
-- ============================================
CREATE TABLE artist (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL
);

-- ============================================
-- SONG
-- ============================================
CREATE TABLE song (
    id           SERIAL PRIMARY KEY,
    title        VARCHAR(200) NOT NULL,
    id_artist    INT NOT NULL REFERENCES artist(id) ON DELETE RESTRICT,
    release_date DATE,
    cover_url    TEXT,
    duration     INT,          -- duración en segundos
    url          TEXT NOT NULL -- archivo/URL del audio
);

-- ============================================
-- SONG_ARTIST (N:M)
-- ============================================
CREATE TABLE song_artist (
    id_song   INT NOT NULL REFERENCES song(id)   ON DELETE CASCADE,
    id_artist INT NOT NULL REFERENCES artist(id) ON DELETE CASCADE,
    PRIMARY KEY (id_song, id_artist)
);

-- ============================================
-- GENRE + SONG_GENRE
-- ============================================
CREATE TABLE genre (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE song_genre (
    id_song  INT NOT NULL REFERENCES song(id)  ON DELETE CASCADE,
    id_genre INT NOT NULL REFERENCES genre(id) ON DELETE CASCADE,
    PRIMARY KEY (id_song, id_genre)
);

-- ============================================
-- MOOD + SONG_MOOD
-- ============================================
CREATE TABLE mood (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE song_mood (
    id_song INT NOT NULL REFERENCES song(id) ON DELETE CASCADE,
    id_mood INT NOT NULL REFERENCES mood(id) ON DELETE CASCADE,
    PRIMARY KEY (id_song, id_mood)
);

-- ============================================
-- PLAYLIST
-- ============================================
CREATE TABLE playlist (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(150) NOT NULL,
    description      TEXT,
    id_creator       INT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    type             VARCHAR(20) NOT NULL CHECK (type IN ('personal','colab')),
    is_public        BOOLEAN NOT NULL DEFAULT FALSE,
    token_invitation VARCHAR(255),
    creation_date    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- PLAYLIST_MEMBER (N:M)
-- ============================================
CREATE TABLE playlist_member (
    id_playlist INT NOT NULL REFERENCES playlist(id) ON DELETE CASCADE,
    id_user     INT NOT NULL REFERENCES "user"(id)   ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL CHECK (role IN ('creator','colaborator')),
    join_date   TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id_playlist, id_user)
);

-- ============================================
-- PLAYLIST_SONG (N:M con orden)
-- ============================================
CREATE TABLE playlist_song (
    id_playlist INT NOT NULL REFERENCES playlist(id) ON DELETE CASCADE,
    id_song     INT NOT NULL REFERENCES song(id)     ON DELETE CASCADE,
    position    INT NOT NULL,
    added_date  TIMESTAMP NOT NULL DEFAULT NOW(),
    added_by    INT NOT NULL REFERENCES "user"(id)   ON DELETE SET NULL,
    PRIMARY KEY (id_playlist, id_song)
);

-- ============================================
-- FAVORITE (N:M User–Song)
-- ============================================
CREATE TABLE favorite (
    id_user     INT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    id_song     INT NOT NULL REFERENCES song(id)   ON DELETE CASCADE,
    marked_date TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id_user, id_song)
);

-- ============================================
-- FOLLOW (N:M User–User)
-- ============================================
CREATE TABLE follow (
    follower_id INT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    followed_id INT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    follow_date TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, followed_id),
    CHECK (follower_id <> followed_id)
);

-- ============================================
-- CONTENT
-- ============================================
CREATE TABLE content (
    id        SERIAL PRIMARY KEY,
    id_author INT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    text      TEXT NOT NULL,
    id_song   INT REFERENCES song(id) ON DELETE CASCADE,
    date      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- CONTENT_PLAYEMENT (N:M Content–User)
-- ============================================
CREATE TABLE content_playement (
    id_content INT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    id_user    INT NOT NULL REFERENCES "user"(id)  ON DELETE CASCADE,
    PRIMARY KEY (id_content, id_user)
);

-- ============================================
-- ROOM
-- ============================================
CREATE TABLE room (
    id                  SERIAL PRIMARY KEY,
    code                VARCHAR(20) NOT NULL UNIQUE,
    name                VARCHAR(150) NOT NULL,
    description         TEXT,
    id_playlist_source  INT NOT NULL REFERENCES playlist(id) ON DELETE RESTRICT,
    is_private          BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash       VARCHAR(255),
    max_capacity        INT NOT NULL,
    status              VARCHAR(20) NOT NULL CHECK (status IN ('activa','cerrada')),
    creation_date       TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMP
);

-- ============================================
-- ROOM_MEMBER (N:M)
-- ============================================
CREATE TABLE room_member (
    id_room   INT NOT NULL REFERENCES room(id)     ON DELETE CASCADE,
    id_user   INT NOT NULL REFERENCES "user"(id)   ON DELETE CASCADE,
    role      VARCHAR(20) NOT NULL CHECK (role IN ('host','member')),
    join_date TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id_room, id_user)
);

-- ============================================
-- HOST_RATING
-- ============================================
CREATE TABLE host_rating (
    id_room     INT NOT NULL REFERENCES room(id)   ON DELETE CASCADE,
    id_rater    INT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    id_host     INT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    rating_date TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id_room, id_rater, id_host)
);