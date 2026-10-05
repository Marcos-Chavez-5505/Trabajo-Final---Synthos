import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
		// `seed.js` puebla el catálogo (artistas, canciones, géneros, moods) y
		// `seedRooms.js` las salas de prueba de TS-17, que necesitan usuarios y
		// playlists fuente. Los dos son idempotentes, así que `db seed` los puede
		// correr las veces que haga falta. El orden importa: las salas referencian
		// canciones del catálogo.
		seed: "node prisma/seed.js && node prisma/seedRooms.js",
	},
	datasource: { url: env("DATABASE_URL") },
});

