const bcrypt = require("bcrypt");
const prisma = require("../prisma/prismaClient");

const SALT_ROUNDS = 10;

async function findUserByEmailOrUsername(email, username) {
	return prisma.user.findFirst({
		where: {
			OR: [{ email }, { username }],
		},
		select: { id: true, email: true, username: true },
	});
}

async function registerUser({ email, username, password }) {
	const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

	return prisma.user.create({
		data: { email, username, passwordHash },
		select: {
			id: true,
			email: true,
			username: true,
			pictureUrl: true,
			biography: true,
			registrationDate: true,
		},
	});
}

async function findUserByEmail(email) {
	return prisma.user.findUnique({
		where: { email },
	});
}

async function loginUser(email, password) {
	const user = await findUserByEmail(email);

	if (!user) {
		return null;
	}

	const passwordMatches = await bcrypt.compare(password, user.passwordHash);

	if (!passwordMatches) {
		return null;
	}

	const { passwordHash, ...userWithoutPassword } = user;

	return userWithoutPassword;
}

module.exports = {
	findUserByEmailOrUsername,
	registerUser,
	loginUser,
};