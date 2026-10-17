const rooms = new Map();

function getRoomState(roomId) {
	if (!rooms.has(roomId)) {
		rooms.set(roomId, {
			playback: {
				songId: null,
				status: "stopped",
				positionMs: 0,
				updatedAt: Date.now(),
			},
			skipVotes: {
				voters: new Set(),
				required: 0,
			},
		});
	}
	return rooms.get(roomId);
}

function updatePlayback(roomId, playback) {
	const state = getRoomState(roomId);
	state.playback = { ...state.playback, ...playback, updatedAt: Date.now() };
	return state.playback;
}

function clearSkipVotes(roomId) {
	const state = getRoomState(roomId);
	state.skipVotes.voters.clear();
	state.skipVotes.required = 0;
}

function setSkipVotesRequired(roomId, required) {
	const state = getRoomState(roomId);
	state.skipVotes.required = required;
}

function addSkipVote(roomId, userId) {
	const state = getRoomState(roomId);
	state.skipVotes.voters.add(userId);
	return state.skipVotes;
}

function hasVoted(roomId, userId) {
	return getRoomState(roomId).skipVotes.voters.has(userId);
}

function getSkipVotes(roomId) {
	return getRoomState(roomId).skipVotes;
}

function deleteRoomState(roomId) {
	rooms.delete(roomId);
}

module.exports = {
	getRoomState,
	updatePlayback,
	clearSkipVotes,
	setSkipVotesRequired,
	addSkipVote,
	hasVoted,
	getSkipVotes,
	deleteRoomState,
};