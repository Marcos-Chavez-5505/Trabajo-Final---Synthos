const userService = require("../services/user.service");

async function searchUsers(req, res, next) {
	try {
		const { query = "", cursor = null } = req.query;

		console.log(query);
		const results = await userService.searchUsers(query, cursor);

		res.status(200).json(results);
	} catch (error) {
		next(error);
	}
}

module.exports = { searchUsers };
