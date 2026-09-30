function getId(req) {
	const id = req.params.id;
	if (isNaN(Number(id)) || Number(id) < 0) {
		throw new Error("ID INVALIDA, DEBE SER UN NUMERO ENTERO > 0");
	} else {
		return Number(id);
	}
}

module.exports = getId;
