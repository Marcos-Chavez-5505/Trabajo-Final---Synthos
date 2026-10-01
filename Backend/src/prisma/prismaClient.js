/**
 * Se utiliza para instanciar PrismaClient en los servicios. Se usa así:
 *
 * const prisma = require("../prisma/prismaClient");
 * const games = await prisma.game.findMany();
 */

require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaPg({
	connectionString,
});

const prisma = new PrismaClient({
	adapter,
	errorFormat: "pretty",
});

module.exports = prisma;
