const prisma = require("./prisma/prismaClient");

async function main() {
	await prisma.user.create({ data: { email: "a@a.com", name: "Test" } });
	console.log(await prisma.user.findMany());
}

main().catch(console.error());
