function parseId(raw) {
	const id = Number(raw);
	return Number.isInteger(id) && id > 0 ? id : null;
}

function requireId(raw) {
	const id = parseId(raw);
	if (!id) {
		throw httpError(400, "Id inválido.", "INVALID_ID");
	}
	return id;
}

module.exports = { parseId, requireId };
