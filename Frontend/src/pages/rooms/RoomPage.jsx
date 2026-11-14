import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
	getRoomById,
	getPlayback,
	controlPlayback,
	closeRoom,
	kickMember,
	leaveRoom,
	voteSkip,
	rateHost,
} from "@synthos/shared";
import {
	connectSocket,
	joinRoomChannel,
	leaveRoomChannel,
	subscribeToRoomEvent,
} from "@synthos/shared";
import { useAuth } from "@synthos/shared";
import { usePlayer } from "@synthos/shared";
import { usePlayerTime } from "@synthos/shared";
import { useRoomPlayback } from "@synthos/shared";
import Avatar from "@/components/ui/Avatar.jsx";
import ProgressBar from '@/features/player/components/ProgressBar.jsx';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import roomIcon from "@synthos/shared/assets/icons/headphones.svg";
import nextTrackIcon from "@synthos/shared/assets/icons/next_track.svg";
import playIcon from "@synthos/shared/assets/icons/play.svg";
import pauseIcon from "@synthos/shared/assets/icons/pause.svg";
import fullHeartIcon from "@synthos/shared/assets/icons/full_heart.svg";
import emptyHeartIcon from "@synthos/shared/assets/icons/empty_heart.svg";
import volumeOnIcon from "@synthos/shared/assets/icons/volume_on.svg";
import volumeOffIcon from "@synthos/shared/assets/icons/volume_off.svg";
import { mapApiError } from "@synthos/shared";
import { clearRoomNotice, writeRoomNotice } from '@/features/rooms/lib/roomNotice.js';

const PLAYBACK_FALLBACK = {
	songId: null,
	status: "stopped",
	positionMs: 0,
	updatedAt: 0,
};

const NOOP = () => {};

export default function RoomPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const { user } = useAuth();
	const viewerId = String(user?.id ?? "");

	const [room, setRoom] = useState(null);
	const [loaded, setLoaded] = useState(false);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState("");

	const [votes, setVotes] = useState({
		voters: [],
		required: 0,
		hasVoted: false,
	});

	const [onlineIds, setOnlineIds] = useState(() => new Set());
	const [rated, setRated] = useState(false);
	const [ratedAtLoad, setRatedAtLoad] = useState(false);
	const [ratingValue, setRatingValue] = useState(0);
	const [actionError, setActionError] = useState("");
	const [pending, setPending] = useState("");

	const [forcedExit, setForcedExit] = useState(null);

	const membership =
		room?.members.find((member) => member.userId === viewerId) ?? null;
	const isHost = membership?.role === "host";
	const host = room?.members.find((member) => member.role === "host") ?? null;

	const syncPlaybackRef = useRef(null);

	const requestNext = useCallback(async () => {
		try {
			const next = await controlPlayback(id, "next");
			syncPlaybackRef.current?.(next);
		} catch (cause) {
			setActionError(mapApiError(cause));
		}
	}, [id]);


	const {
		playback,
		isBlocked,
		resume,
		sync: syncPlayback,
	} = useRoomPlayback({
		roomId: id,
		songs: room?.songs,
		isHost,
		onEnded: requestNext,
	});

	syncPlaybackRef.current = syncPlayback;

	function goToRooms() {
		clearRoomNotice();
		navigate("/salas", { replace: true });
	}

	useEffect(() => {
		let active = true;

		setLoading(true);
		setLoadError("");

		getRoomById(id)
			.then((found) => {
				if (!active) return;

				if (!found) {
					navigate("/salas", { replace: true });
					return;
				}

				setRoom(found);
				setRatedAtLoad(Boolean(found.viewerHasRated));
				setLoaded(true);
				setLoading(false);
			})
			.catch((cause) => {
				if (!active) return;

				setLoadError(mapApiError(cause));
				setLoading(false);
			});

		return () => {
			active = false;
		};
	}, [id, navigate]);


	useEffect(() => {
		if (!loaded) return undefined;

		let active = true;

		connectSocket();
		joinRoomChannel(id);

		getPlayback(id)
			.then((data) => {
				if (!active) return;

				syncPlayback(data.playback);
				setVotes(data.skipVotes);
			})
			.catch((cause) => {
				if (active) setActionError(mapApiError(cause));
			});


		const offJoined = subscribeToRoomEvent("joined-room", (payload) => {
			if (!active || Number(payload?.roomId) !== Number(id)) return;

			getPlayback(id)
				.then((data) => {
					if (!active) return;

					syncPlayback(data.playback);
					setVotes(data.skipVotes);
				})
				.catch(() => {
					// Si la sala se cerró mientras se estaba desconectado, el GET va a
					// fallar; el evento `room:closed` ya lo habrá traído de vuelta.
				});
		});

		const offMembers = subscribeToRoomEvent("room:members", (members) => {
			if (!active) return;

			// Llega con las filas del backend, que traen `idUser` y el usuario anidado.
			const parsed = members.map((raw) => ({
				userId: String(raw.idUser ?? raw.id_user ?? raw.user?.id),
				username: raw.user?.username ?? "",
				avatarUrl: raw.user?.pictureUrl ?? null,
				role: raw.role,
			}));

			setRoom((current) =>
				current
					? { ...current, members: parsed, membersCount: parsed.length }
					: current,
			);
		});

		const offSkip = subscribeToRoomEvent("room:skip-votes", (payload) => {
			if (!active) return;

			const voters = (payload?.voters ?? []).map(String);

			setVotes({
				voters,
				required: Number(payload?.required ?? 0),
				hasVoted: voters.includes(viewerId),
			});
		});

		const offOnline = subscribeToRoomEvent("room:online", (payload) => {
			if (!active || Number(payload?.roomId) !== Number(id)) return;

			setOnlineIds(new Set((payload?.userIds ?? []).map(String)));
		});

		const offRating = subscribeToRoomEvent("room:rating", (payload) => {
			if (!active) return;

			const avg = Number(payload?.avgRating ?? 0);

			setRoom((current) =>
				current ? { ...current, hostRating: avg === 0 ? null : avg } : current,
			);
		});

		const offKicked = subscribeToRoomEvent("room:kicked", () => {
			if (!active) return;
			clearRoomNotice();
			setForcedExit({
				title: "Te sacaron de la sala",
				message:
					"El anfitrión te quitó de esta sala. Podés volver al listado para entrar a otra.",
			});
		});

		const offClosed = subscribeToRoomEvent("room:closed", () => {
			if (!active) return;
			clearRoomNotice();
			setForcedExit({
				title: "La sala se cerró",
				message:
					"Esta sala ya no está disponible. Podés volver al listado para buscar otra.",
			});
		});

		return () => {
			active = false;
			leaveRoomChannel(id);
			offJoined();
			offMembers();
			offSkip();
			offOnline();
			offRating();
			offKicked();
			offClosed();
		};
	}, [id, loaded, navigate, viewerId, syncPlayback]);

	const effectivePlayback = playback ?? PLAYBACK_FALLBACK;
	const playing = effectivePlayback.status === "playing";

	const canPlay = (room?.songs.length ?? 0) > 0;
	const hasSong =
		Boolean(effectivePlayback.songId) && effectivePlayback.status !== "stopped";

	/** Envuelve una acción: bloquea la pantalla, limpia el error y reporta fallos. */
	const runAction = useCallback(async (name, action) => {
		setPending(name);
		setActionError("");

		try {
			await action();
		} catch (cause) {
			setActionError(mapApiError(cause));
		} finally {
			setPending("");
		}
	}, []);

	function handleLeave() {
		if (!window.confirm("¿Salís de la sala?")) return;

		runAction("leave", async () => {
			await leaveRoom(id);

			writeRoomNotice(
				isHost ? "Cerraste la sala al salir." : "Saliste de la sala.",
			);
			navigate("/salas", { replace: true });
		});
	}

	function handleCloseRoom() {
		if (!window.confirm("¿Cerrás la sala? Se termina para todos.")) return;

		runAction("close", async () => {
			await closeRoom(id);

			// Los demás reciben `room:closed`; quien la cerró ya está fuera.
			navigate("/salas", { replace: true });
		});
	}

	function handleVoteSkip() {
		runAction("vote", async () => {
			const result = await voteSkip(id);

			setVotes(result.skipVotes);
		});
	}

	function handleRate(value) {
		if (!value || value < 1 || value > 5) return;

		runAction("rate", async () => {
			// `rateHost` devuelve `false` (sin tirar) si el backend rechazó la
			// calificación por 403 o por 409, que es lo que deja el botón deshabilitado.
			setRated(await rateHost(id, value));
		});
	}

	function handleKick(targetUserId, username) {
		if (!window.confirm(`¿Sacá a ${username} de la sala?`)) return;

		runAction(`kick:${targetUserId}`, async () => {
			await kickMember(id, targetUserId);

			setRoom((current) =>
				current
					? {
							...current,
							members: current.members.filter((m) => m.userId !== targetUserId),
							membersCount: current.members.length - 1,
						}
					: current,
			);
		});
	}

	if (loading) {
		return (
			<section className="px-6 py-4 md:px-10">
				<p className="text-muted-foreground TextRegluar">Cargando la sala…</p>
			</section>
		);
	}

	if (loadError || !room) {
		return (
			<section className="px-6 py-4 md:px-10">
				{loadError && (
					<p className="max-w-md rounded px-3 py-2 Salmon TextMedium">
						{loadError}
					</p>
				)}
				<Link
					to="/salas"
					className="mt-4 inline-block rounded px-4 py-2 Volume Button hover:brightness-110"
				>
					Volver a las salas
				</Link>
			</section>
		);
	}

	const nonHostCount = room.members.filter(
		(member) => member.role !== "host",
	).length;
	const required =
		votes.required > 0 ? votes.required : Math.floor(nonHostCount / 2) + 1;

	return (
		<section className="px-6 py-4 md:px-10">
			<Link
				to="/salas"
				className="text-muted-foreground TextMedium hover:text-foreground"
			>
				← Todas las salas
			</Link>

			<RoomHeader room={room} host={host} />

			{actionError && (
				<p className="mt-4 max-w-2xl rounded px-3 py-2 Salmon TextMedium">
					{actionError}
				</p>
			)}

			<RoomPlayer
				room={room}
				isHost={isHost}
				playing={playing}
				canPlay={canPlay}
				hasSong={hasSong}
				isBlocked={isBlocked}
				onResume={resume}
				onControl={(action) =>
					runAction(action, async () => {
						const next = await controlPlayback(id, action);
						syncPlayback(next);
					})
				}
				controlPending={Boolean(pending)}
				votes={votes.voters.length}
				required={required}
				voted={votes.hasVoted}
				onVoteSkip={handleVoteSkip}
				voting={pending === "vote"}
				rated={rated || ratedAtLoad}
				rating={pending === "rate"}
				onRate={handleRate}
				ratingValue={ratingValue}
				setRatingValue={setRatingValue}
			/>

			<RoomMembers
				room={room}
				viewerId={viewerId}
				isHost={isHost}
				onlineIds={onlineIds}
				onKick={handleKick}
			/>

			<footer className="mt-8 flex flex-wrap gap-2">
                {!isHost ? (
                    <button
                        type="button"
                        onClick={handleLeave}
                        disabled={Boolean(pending)}
                        className="rounded px-4 py-2 Volume Button hover:brightness-110 disabled:opacity-50"
                    >
                        Salir de la sala
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleCloseRoom}
                        disabled={Boolean(pending)}
                        className="rounded px-4 py-2 Salmon Button hover:brightness-110 disabled:opacity-50"
                    >
                        {pending === "close" ? "Cerrando…" : "Cerrar la sala"}
                    </button>
                )}
            </footer>

			<Dialog
				open={Boolean(forcedExit)}
				onOpenChange={(open) => {
					if (!open) goToRooms();
				}}
			>
				<DialogContent showCloseButton={false}>
					<DialogHeader>
						<DialogTitle>{forcedExit?.title ?? "Sala no disponible"}</DialogTitle>
						<DialogDescription>
							{forcedExit?.message ?? "Volvé al listado para continuar."}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<button
							type="button"
							onClick={goToRooms}
							className="rounded px-4 py-2 Fucsia Button hover:brightness-110"
						>
							Ir a Salas
						</button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</section>
	);
}

function RoomHeader({ room, host }) {
	return (
		<header className="mt-4 max-w-2xl rounded-lg p-6 SurfaceLight Elevation1">
			<div className="flex items-start gap-3">
				<div className="Light CardRadius flex h-12 w-12 shrink-0 items-center justify-center">
					<img
						src={roomIcon}
						alt=""
						aria-hidden="true"
						className="h-6 w-6 invert opacity-70"
					/>
				</div>

				<div className="min-w-0 flex-1">
					<h1 className="text-foreground Header3 truncate">{room.name}</h1>
					<p className="text-muted-foreground TextMedium mt-1">
						Código <span className="TextFucsia">{room.code}</span>
						{room.isPrivate && <span className="TextTiny"> · privada</span>}
					</p>
				</div>
			</div>

			{room.description && (
				<p className="text-muted-foreground TextRegluar mt-4">
					{room.description}
				</p>
			)}

			<dl className="text-muted-foreground TextMedium mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
				<div>
					<dt className="TextTiny">Anfitriona</dt>
					<dd className="text-foreground TextRegluar">
						{host?.username ?? "—"}
					</dd>
				</div>
				<div>
					<dt className="TextTiny">Personas</dt>
					<dd className="text-foreground TextRegluar">
						{room.members.length}/{room.maxCapacity ?? "—"}
					</dd>
				</div>
				<div>
					<dt className="TextTiny">Canciones</dt>
					<dd className="text-foreground TextRegluar">{room.songsCount}</dd>
				</div>
				{room.playlistName && (
					<div className="col-span-2 sm:col-span-3">
						<dt className="TextTiny">Playlist fuente</dt>
						<dd className="text-foreground TextRegluar truncate">
							{room.playlistName}
						</dd>
					</div>
				)}
			</dl>
		</header>
	);
}

/**
 * Reproductor de la sala.
 */
function RoomPlayer({
	room,
	isHost,
	playing,
	canPlay,
	hasSong,
	isBlocked,
	onResume,
	onControl,
	controlPending,
	votes,
	required,
	voted,
	onVoteSkip,
	voting,
	rated,
	rating,
	onRate,
	ratingValue,
	setRatingValue,
}) {
	const { song, seek, isMuted, toggleMute } = usePlayer();
	const { currentTime, duration } = usePlayerTime();

	return (
		<div className="mt-6 max-w-2xl rounded-lg p-6 SurfaceLight Elevation1">
			<div className="flex items-center gap-3">
				<div className="Light CardRadius flex h-12 w-12 shrink-0 items-center justify-center">
					<img
						src={playing ? pauseIcon : playIcon}
						alt=""
						aria-hidden="true"
						className="h-5 w-5 invert opacity-80"
					/>
				</div>

				<div className="min-w-0 flex-1">
					<p className="text-foreground TextRegluar truncate">
						{song ? song.title : "Nada reproduciendo"}
					</p>
					<p className="text-muted-foreground TextTiny truncate">
						{song ? song.artist : "La sala todavía no empezó a reproducir"}
					</p>
				</div>

				{isHost && (
					<HostControls
						playing={playing}
						canPlay={canPlay}
						hasSong={hasSong}
						disabled={controlPending}
						onControl={onControl}
					/>
				)}
			</div>

			<div className="mt-4">
				<div className={isHost ? undefined : "pointer-events-none"}>
					<ProgressBar
						currentTime={currentTime}
						duration={duration}
						onSeek={isHost ? seek : NOOP}
						size="sm"
					/>
				</div>
			</div>

			{isBlocked && (
				<button
					type="button"
					onClick={onResume}
					className="mt-4 w-full rounded px-4 py-2 Fucsia Button hover:brightness-110"
				>
					Tocar para escuchar
				</button>
			)}

			<div className="mt-4 flex flex-wrap items-center gap-3 border-t border-sidebar-border pt-4">
				<SkipVoteControl
					isHost={isHost}
					votes={votes}
					required={required}
					voted={voted}
					hasSong={hasSong}
					onVote={onVoteSkip}
					pending={voting}
				/>

				{/* Silencio local de quien mira la sala, también para el anfitrión: no
            viaja por el socket, así que no cambia el audio de los demás. */}
				<button
					type="button"
					onClick={toggleMute}
					aria-pressed={isMuted}
					title={
						isMuted
							? "Silenciaste este dispositivo. La sala sigue sonando para los demás."
							: "Silencia el audio solo en este dispositivo."
					}
					className={`flex items-center gap-2 rounded px-3 py-2 Button hover:brightness-110 ${
						isMuted ? "Fucsia" : "Volume"
					}`}
				>
					<img
						src={isMuted ? volumeOffIcon : volumeOnIcon}
						alt=""
						aria-hidden="true"
						className="h-4 w-4"
					/>
					{isMuted ? "Activar sonido" : "Silenciar"}
				</button>

				{!isHost && (
					<div className="ml-auto flex items-center gap-2">
						{rated ? (
							<div className="flex items-center gap-2 rounded px-3 py-2 Volume">
								<img
									src={fullHeartIcon}
									alt=""
									aria-hidden="true"
									className="h-4 w-4"
								/>
								<span className="TextMedium">Calificaste al anfitrión</span>
							</div>
						) : (
							<div className="flex items-center gap-1">
								{[1, 2, 3, 4, 5].map((star) => {
									const active = star <= ratingValue;

									return (
										<button
											key={star}
											type="button"
											onClick={() => onRate(star)}
											onMouseEnter={() => setRatingValue(star)}
											onMouseLeave={() => setRatingValue(0)}
											disabled={rating}
											title={`Calificar con ${star} ${star === 1 ? "estrella" : "estrellas"}`}
											className="rounded p-1 hover:brightness-110 disabled:opacity-50"
										>
											<img
												src={active ? fullHeartIcon : emptyHeartIcon}
												alt=""
												aria-hidden="true"
												className="h-4 w-4"
											/>
										</button>
									);
								})}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

/**
 * Controles de reproducción del anfitrión.
 */
function HostControls({ playing, canPlay, hasSong, disabled, onControl }) {
	return (
		<div className="flex items-center gap-1.5">
			<button
				type="button"
				onClick={() => onControl(playing ? "pause" : "play")}
				disabled={disabled || !canPlay}
				aria-label={playing ? "Pausar para todos" : "Reproducir para todos"}
				title={
					canPlay
						? undefined
						: "La playlist fuente de la sala no tiene canciones para reproducir."
				}
				className="rounded p-2 Volume Button hover:brightness-110 disabled:opacity-50"
			>
				<img
					src={playing ? pauseIcon : playIcon}
					alt=""
					aria-hidden="true"
					className="h-4 w-4 invert"
				/>
			</button>

			<button
				type="button"
				onClick={() => onControl("next")}
				disabled={disabled || !canPlay}
				aria-label="Siguiente canción para todos"
				className="rounded p-2 Volume Button hover:brightness-110 disabled:opacity-50"
			>
				<img
					src={nextTrackIcon}
					alt=""
					aria-hidden="true"
					className="h-4 w-4 invert"
				/>
			</button>

			<button
				type="button"
				onClick={() => onControl("stop")}
				disabled={disabled || !hasSong}
				aria-label="Detener la reproducción"
				className="rounded px-3 py-2 Volume Button hover:brightness-110 disabled:opacity-50"
			>
				Detener
			</button>
		</div>
	);
}

/**
 * Votación para saltar (TS-18).
 */
function SkipVoteControl({
	isHost,
	votes,
	required,
	voted,
	hasSong,
	onVote,
	pending,
}) {
	if (isHost) {
		return (
			<span className="text-muted-foreground TextTiny">
				Saltos por votación: {votes}/{required}
			</span>
		);
	}

	return (
		<button
			type="button"
			onClick={onVote}
			disabled={voted || !hasSong || pending}
			className="flex items-center gap-2 rounded px-3 py-2 Volume Button hover:brightness-110 disabled:opacity-50"
		>
			Votar para saltar
			<span className="text-muted-foreground TextTiny">
				{votes}/{required}
			</span>
		</button>
	);
}

function RoomMembers({ room, viewerId, isHost, onlineIds, onKick }) {
	const ordered = [...room.members].sort((a, b) => {
		if (a.role === "host") return -1;
		if (b.role === "host") return 1;

		return a.username.localeCompare(b.username, "es", { sensitivity: "base" });
	});

	return (
		<div className="mt-6 max-w-2xl">
			<h2 className="text-foreground Header4">
				Personas ({room.members.length}/{room.maxCapacity ?? "—"})
			</h2>

			<ul className="mt-3 space-y-2">
				{ordered.map((member) => {
					const online = onlineIds.has(String(member.userId));

					return (
						<li
							key={member.userId}
							className="flex items-center gap-3 rounded-lg p-3 SurfaceLight Elevation1"
						>
							<div className="relative">
								<Avatar
									src={member.avatarUrl}
									name={member.username || "?"}
									to={`/profile/${member.userId}`}
									className="h-8 w-8"
								/>
								<span
									className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-SurfaceLight ${
										online ? "bg-green-500" : "bg-muted-foreground"
									}`}
									aria-label={online ? "En línea" : "Desconectado"}
									title={online ? "En línea" : "Desconectado"}
								/>
							</div>

							<div className="min-w-0 flex-1">
								<p className="text-foreground TextRegluar truncate">
									<Link to={`/profile/${member.userId}`} className="hover:underline">
										{member.username || "Usuario"}
									</Link>{" "}
									{member.userId === viewerId && (
										<span className="text-muted-foreground TextTiny">(vos)</span>
									)}
								</p>
								<p className="text-muted-foreground TextTiny">
									{member.role === "host"
										? "Anfitriona · administra la sala"
										: "Participante"}
									{online ? " · en línea" : ""}
								</p>
							</div>

							{isHost && member.role !== "host" && (
								<button
									type="button"
									onClick={() => onKick(member.userId, member.username)}
									className="rounded px-3 py-1.5 Volume Button hover:brightness-110"
								>
									Sacar
								</button>
							)}
						</li>
					);
				})}
			</ul>
		</div>
	);
}