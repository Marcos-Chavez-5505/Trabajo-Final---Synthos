const express = require("express");
const cors = require("cors");

const songRoutes = require("./routes/song.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const favoriteRoutes = require("./routes/favorite.routes");
const playlistRoutes = require("./routes/playlist.routes");
const roomRoutes = require("./routes/room.routes");

const prismaErrorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

//! TODOS LOS ENDPOINTS EMPIEZAN POR /API
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/songs", songRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/rooms", roomRoutes);

app.use(prismaErrorHandler);
app.use((err, req, res, next) => {
	console.error("[Unhandled Error]", err);
	res.status(err.code || 500).json({
		status: "error",
		message: err.message || "Ha ocurrido un error en el servidor",
	});
});

module.exports = app;
