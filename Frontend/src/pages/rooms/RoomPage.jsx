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
import { useRoomAccessGuard } from "@synthos/shared";
import Avatar from "@/components/ui/Avatar.jsx";
import ProgressBar from '@/features/player/components/ProgressBar.jsx';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { toastMessages } from "@/lib/toastMessages.js";
import roomIcon from "@synthos/shared/assets/icons/headphones.svg";
import nextTrackIcon from "@synthos/shared/assets/icons/next_track.svg";
import playIcon from "@synthos/shared/assets/icons/play.svg";
import pauseIcon from "@synthos/shared/assets/icons/pause.svg";
import fullHeartIcon from "@synthos/shared/assets/icons/full_heart.svg";
import emptyHeartIcon from "@synthos/shared/assets/icons/empty_heart.svg";
import volumeOnIcon from "@synthos/shared/assets/icons/volume_on.svg";
import volumeOffIcon from "@synthos/shared/assets/icons/volume_off.svg";

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
	const [loadFailed, setLoadFailed] = useState(false);

	const [votes, setVotes] = useState({
		voters: [],
		required: 0,
		hasVoted: false,
	});
	const [onlineIds, setOnlineIds] = useState(() => new Set());
	const [rated, setRated] = useState(false);
	const [ratedAtLoad, setRatedAtLoad] = useState(false);
	const [ratingValue, setRatingValue] = useState(0);
	const [pending, setPending] = useState("");
	// `confirm` conserva el contenido mientras el diálogo se desvanece y
	// `confirmOpen` controla la visibilidad. Si se limpiaran juntos, durante la
	// animación de cierre se vería el fallback "Confirmar acción".
	const [confirm, setConfirm] = useState(null);
	const [confirmOpen, setConfirmOpen] = useState(false);
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
			toastMessages.roomControlError(cause);
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
		navigate("/salas", { replace: true });
	}

	// Pérdida de acceso (inactividad, kick, 403 de la API o `join-room` al
	// reconectar): un solo aviso, sin modal y sin volver a entrar. `replace`
	// deja el listado en lugar de la sala en el historial.
	const { reportError } = useRoomAccessGuard(id, {
		onLost: (reason) => {
			toastMessages.roomAccessLost(reason);
			goToRooms();
		},
	});

	useEffect(() => {
		let active = true;

		setLoading(true);
		setLoadFailed(false);

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

				// La pérdida de acceso ya muestra su toast y redirige: no se
				// suma el error genérico ni la pantalla de "volver".
				if (reportError(cause)) return;

				toastMessages.roomLoadError(cause);
				setLoadFailed(true);
				setLoading(false);
			});

		return () => {
			active = false;
		};
	}, [id, navigate, reportError]);

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
				if (active && !reportError(cause)) {
					toastMessages.roomPlaybackError(cause);
				}
			});

		const offJoined = subscribeToRoomEvent("joined-room", (payload) => {
			if (!active || Number(payload?.roomId) !== Number(id)) return;

			getPlayback(id)
				.then((data) => {
					if (!active) return;

					syncPlayback(data.playback);
					setVotes(data.skipVotes);
				})
				.catch(() => {});
		});

		const offMembers = subscribeToRoomEvent("room:members", (members) => {
			if (!active) return;

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

		const offClosed = subscribeToRoomEvent("room:closed", () => {
			if (!active) return;
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
			offClosed();
		};
	}, [id, loaded, navigate, viewerId, syncPlayback, reportError]);

	const effectivePlayback = playback ?? PLAYBACK_FALLBACK;
	const playing = effectivePlayback.status === "playing";

	const canPlay = (room?.songs.length ?? 0) > 0;
	const hasSong =
		Boolean(effectivePlayback.songId) && effectivePlayback.status !== "stopped";

	const runAction = useCallback(
		async (name, action, onError = toastMessages.roomActionError) => {
			setPending(name);

			try {
				await action();
			} catch (cause) {
				// Si el 403 es pérdida de acceso, el guard ya avisó y redirigió.
				if (!reportError(cause)) onError(cause);
			} finally {
				setPending("");
			}
		},
		[reportError],
	);

	function handleLeave() {
		setConfirm({
			title: "¿Salir de la sala?",
			description: isHost
				? "Sos la anfitriona: al salir, la sala se cierra para todos."
				: "Dejás de escuchar con el resto. Podés volver a entrar con el código.",
			actionLabel: isHost ? "Cerrar y salir" : "Salir",
			destructive: isHost,
			onConfirm: () =>
				runAction(
					"leave",
					async () => {
						await leaveRoom(id);

						toastMessages.roomLeft(isHost);
						navigate("/salas", { replace: true });
					},
					toastMessages.roomLeaveError,
				),
		});
		setConfirmOpen(true);
	}

	function handleCloseRoom() {
		setConfirm({
			title: "¿Cerrar la sala?",
			description: "Se termina para todos. Esta acción no se puede deshacer.",
			actionLabel: "Cerrar la sala",
			destructive: true,
			onConfirm: () =>
				runAction(
					"close",
					async () => {
						await closeRoom(id);

						toastMessages.roomClosed();
						navigate("/salas", { replace: true });
					},
					toastMessages.roomCloseError,
				),
		});
		setConfirmOpen(true);
	}

	function handleVoteSkip() {
		runAction(
			"vote",
			async () => {
				const result = await voteSkip(id);

				setVotes(result.skipVotes);
			},
			toastMessages.roomVoteError,
		);
	}

	function handleRate(value) {
		if (!value || value < 1 || value > 5) return;

		runAction(
			"rate",
			async () => {
				setRated(await rateHost(id, value));
			},
			toastMessages.roomRateError,
		);
	}

	function handleKick(targetUserId, username) {
		setConfirm({
			title: `¿Sacar a ${username} de la sala?`,
			description:
				"Va a salir de la sala y dejará de escuchar con el resto.",
			actionLabel: "Sacar",
			destructive: true,
			onConfirm: () =>
				runAction(
					`kick:${targetUserId}`,
					async () => {
						await kickMember(id, targetUserId);

						setRoom((current) =>
							current
								? {
										...current,
										members: current.members.filter(
											(m) => m.userId !== targetUserId,
										),
										membersCount: current.members.length - 1,
									}
								: current,
						);
						toastMessages.roomMemberKicked(username);
					},
					toastMessages.roomKickError,
				),
		});
		setConfirmOpen(true);
	}

	function handlePlaySong(songId) {
		if (!isHost) return;

		runAction(
			"play-song",
			async () => {
				const next = await controlPlayback(id, "play-song", songId);
				syncPlayback(next);
			},
			toastMessages.roomPlaySongError,
		);
	}

	if (loading) {
		return (
			<section className="px-6 py-4 md:px-10">
				<p className="text-muted-foreground TextRegluar">Cargando la sala…</p>
			</section>
		);
	}

	if (loadFailed || !room) {
		return (
			<section className="px-6 py-4 md:px-10">
				<Link
					to="/salas"
					className="inline-block rounded px-4 py-2 Volume Button hover:brightness-110"
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

			<RoomPlayer
				room={room}
				isHost={isHost}
				playing={playing}
				canPlay={canPlay}
				hasSong={hasSong}
				isBlocked={isBlocked}
				onResume={resume}
				onControl={(action) =>
					runAction(
						action,
						async () => {
							const next = await controlPlayback(id, action);
							syncPlayback(next);
						},
						toastMessages.roomControlError,
					)
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

			<RoomPlaylist
				room={room}
				currentSongId={effectivePlayback.songId}
				isHost={isHost}
				onPlaySong={handlePlaySong}
				disabled={Boolean(pending)}
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

			<AlertDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
			>
				<AlertDialogContent size="sm">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{confirm?.title ?? "Confirmar acción"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{confirm?.description ?? ""}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel size="lg" className="h-10 px-4">
							Cancelar
						</AlertDialogCancel>
						<AlertDialogAction
							size="lg"
							className={`h-10 px-4 text-(--ds-lighter) ${
								confirm?.destructive
									? "bg-(--ds-salmon) hover:bg-(--ds-salmon)/80"
									: "bg-(--ds-fucsia) hover:bg-(--ds-fucsia)/80"
							}`}
							onClick={() => {
								const action = confirm?.onConfirm;

								setConfirmOpen(false);
								action?.();
							}}
						>
							{confirm?.actionLabel ?? "Confirmar"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={Boolean(forcedExit)}
				onOpenChange={(open) => {
					if (!open) goToRooms();
				}}
			>
				<AlertDialogContent size="sm">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{forcedExit?.title ?? "Sala no disponible"}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{forcedExit?.message ?? "Volvé al listado para continuar."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction
							size="lg"
							className="h-10 px-4 bg-(--ds-fucsia) text-(--ds-lighter) hover:bg-(--ds-fucsia)/80"
							onClick={goToRooms}
						>
							Ir a Salas
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
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

function RoomPlaylist({ room, currentSongId, isHost, onPlaySong, disabled }) {
	const songs = room.songs ?? [];

	if (songs.length === 0) return null;

	return (
		<div className="mt-6 max-w-2xl rounded-lg p-6 SurfaceLight Elevation1">
			<h2 className="text-foreground Header4">Canciones de la sala</h2>

			<ul className="mt-3 divide-y divide-sidebar-border">
				{songs.map((song, index) => {
					const isCurrent = String(song.id) === String(currentSongId);

					return (
						<li key={song.id}>
							<button
								type="button"
								onClick={() => onPlaySong(song.id)}
								disabled={!isHost || disabled || isCurrent}
								title={
									isHost
										? isCurrent
											? "Ya está sonando"
											: "Reproducir esta canción para todos"
										: "Solo el anfitrión puede cambiar la canción"
								}
								className={`flex w-full items-center gap-3 rounded px-2 py-2 text-left transition ${
									isCurrent
										? "Fucsia"
										: isHost
											? "hover:bg-Light cursor-pointer"
											: "cursor-default opacity-70"
								} disabled:opacity-60`}
							>
								<span className="TextTiny text-muted-foreground w-6 shrink-0 text-right">
									{isCurrent ? "▶" : index + 1}
								</span>

								<span className="min-w-0 flex-1">
									<span className="TextRegluar block truncate">
										{song.title ?? "Sin título"}
									</span>
									<span className="TextTiny text-muted-foreground block truncate">
										{song.artist ?? "—"}
									</span>
								</span>
							</button>
						</li>
					);
				})}
			</ul>
		</div>
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