import { Link } from "react-router-dom";
import Avatar from "../../components/ui/Avatar.jsx";
import userIcon from "../../assets/user.svg";
import musicNoteIcon from "../../assets/music_note.svg";
import playlistIcon from "../../assets/playlist.svg";
import { formatRelativeTime } from "./formatRelativeTime.js";

const TYPE_META = {
	follow: {
		label: "Nuevo seguidor",
		icon: userIcon,
		badgeClass: "Fucsia",
		action: "Ver perfil",
		href: (notification) => `/profile/${notification.actor.id}`,
	},
	recommendation: {
		label: "Recomendación",
		icon: musicNoteIcon,
		badgeClass: "Plaster",
		action: "Ver recomendación",
		href: () => "/perfil",
	},
	playlist_invitation: {
		label: "Invitación a playlist",
		icon: playlistIcon,
		badgeClass: "Volume",
		action: "Ver invitación",
		href: () => "/playlists?tab=invitaciones",
	},
};

function NotificationText({ notification }) {
	const actor = (
		<span className="text-foreground Button">
			@{notification.actor.username}
		</span>
	);

	if (notification.type === "recommendation") {
		return (
			<p className="TextRegluar">
				{actor} te recomendó{" "}
				<span className="text-foreground Button">
					«{notification.song.title}»
				</span>{" "}
				de {notification.song.artist}.
			</p>
		);
	}

	if (notification.type === "playlist_invitation") {
		return (
			<p className="TextRegluar">
				{actor} te invitó a la playlist{" "}
				<span className="text-foreground Button">
					«{notification.playlist.name}»
				</span>
				.
			</p>
		);
	}

	return <p className="TextRegluar">{actor} empezó a seguirte.</p>;
}

/**
 * Fila de una notificación. Es un link entero, así en mobile se toca en
 * cualquier parte; el indicador de no leída y el badge del tipo son visuales y
 * no agregan interactivos anidados.
 *
 * @param {object} props
 * @param {object} props.notification
 * @param {(id: number) => void} props.onRead
 */
export default function NotificationRow({ notification, onRead }) {
	const meta = TYPE_META[notification.type] ?? TYPE_META.follow;
	const unread = !notification.isRead;

	return (
		<li>
			<Link
				to={meta.href(notification)}
				onClick={() => onRead(notification.id)}
				className={`group relative flex gap-3 rounded-md p-3 transition-colors sm:gap-4 sm:p-4 ${
					unread ? "SurfaceLight Elevation1" : "bg-card/50 hover:bg-card"
				}`}
			>
				{unread && (
					<>
						<span
							className="Fucsia absolute right-3 top-3 size-2 rounded-full"
							aria-hidden="true"
						/>
						<span className="sr-only">Sin leer.</span>
					</>
				)}

				<div className="relative shrink-0">
					<Avatar
						src={notification.actor.avatarUrl}
						name={notification.actor.username}
						className="size-11 sm:size-12"
					/>
					<span
						className={`absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full ring-2 ring-surface ${meta.badgeClass}`}
					>
						<img src={meta.icon} alt="" aria-hidden="true" className="size-3" />
					</span>
				</div>

				<div className="min-w-0 flex-1">
					<NotificationText notification={notification} />
					<p className="TextMedium text-muted-foreground mt-1 flex flex-wrap items-center gap-x-1.5">
						<span>{meta.label}</span>
						<span aria-hidden="true">·</span>
						<time dateTime={notification.createdAt}>
							{formatRelativeTime(notification.createdAt)}
						</time>
					</p>
				</div>

				<span className="Button hidden shrink-0 items-center self-center text-muted-foreground transition-colors group-hover:text-foreground sm:flex">
					{meta.action} →
				</span>
			</Link>
		</li>
	);
}
