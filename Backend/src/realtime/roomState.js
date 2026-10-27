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
			queueOrder: null,
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

function syncQueueOrder(roomId, currentIds) {
	const state = getRoomState(roomId);
	if (!Array.isArray(state.queueOrder)) {
		state.queueOrder = [...currentIds];
		return state.queueOrder;
	}
	const currentSet = new Set(currentIds);
	const kept = state.queueOrder.filter((id) => currentSet.has(id));
	const keptSet = new Set(kept);
	const appended = currentIds.filter((id) => !keptSet.has(id));
	state.queueOrder = [...kept, ...appended];
	return state.queueOrder;
}

function orderSongsByQueue(roomId, songs) {
	const ids = songs.map((s) => s.idSong);
	const order = syncQueueOrder(roomId, ids);
	const byId = new Map(songs.map((s) => [s.idSong, s]));
	return order.map((id) => byId.get(id)).filter(Boolean);
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
	syncQueueOrder,
	orderSongsByQueue,
	deleteRoomState,
};