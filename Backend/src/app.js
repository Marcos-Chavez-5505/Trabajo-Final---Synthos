const express = require("express");
const cors = require("cors");
const songRoutes = require("./routes/song.routes");
const prismaErrorHandler = require("./middlewares/errorHandler");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors());
app.use(express.json());

//! TODOS LOS ENDPOINTS EMPIEZAN POR /API
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/songs", songRoutes);
app.use("/api/auth", authRoutes);

app.use(prismaErrorHandler);
app.use((err, req, res, next) => {
	console.error("[Unhandled Error]", err);
	res.status(500).json({
		status: "error",
		message: "Ha ocurrido un error interno en el servidor.",
	});
});

module.exports = app;
