import { useState } from "react";
import NotificationRow from "./NotificationRow.jsx";
import { mockNotifications } from "./notificationsMock.js";
import notificationIcon from "../../assets/notification.svg";

/**
 * `/notificaciones`: bandeja de novedades de la persona.
 *
 * Por ahora usa `notificationsMock` porque el backend todavía no expone el
 * recurso. Los estados de leída y "marcar todas" son locales: cuando exista el
 * service se reemplazan por las mutaciones de la API y el socket.
 *
 * El layout es una columna de ancho máximo (`max-w-3xl`) con padding
 * responsive, así la misma pantalla se lee bien en desktop y en mobile.
 */
export default function Notifications() {
	const [notifications, setNotifications] = useState(mockNotifications);

	const unreadCount = notifications.filter(
		(notification) => !notification.isRead,
	).length;

	const markAsRead = (id) => {
		setNotifications((previous) =>
			previous.map((notification) =>
				notification.id === id
					? { ...notification, isRead: true }
					: notification,
			),
		);
	};

	const markAllAsRead = () => {
		setNotifications((previous) =>
			previous.map((notification) => ({ ...notification, isRead: true })),
		);
	};

	return (
		<section className="px-4 py-4 sm:px-6 md:px-10">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="Header3">Notificaciones</h1>
					<p className="text-muted-foreground TextRegluar mt-1">
						{unreadCount > 0
							? `Tenés ${unreadCount} ${unreadCount === 1 ? "notificación nueva" : "notificaciones nuevas"}.`
							: "Estás al día. Acá van a aparecer las novedades de tu cuenta."}
					</p>
				</div>

				{unreadCount > 0 && (
					<button
						type="button"
						onClick={markAllAsRead}
						className="rounded px-4 py-2 Volume Button hover:brightness-110"
					>
						Marcar todas como leídas
					</button>
				)}
			</div>

			{notifications.length === 0 ? (
				<EmptyState />
			) : (
				<ul className="mt-6 flex max-w-3xl flex-col gap-2">
					{notifications.map((notification) => (
						<NotificationRow
							key={notification.id}
							notification={notification}
							onRead={markAsRead}
						/>
					))}
				</ul>
			)}
		</section>
	);
}

function EmptyState() {
	return (
		<div className="py-16 text-center">
			<img
				src={notificationIcon}
				alt=""
				aria-hidden="true"
				className="mx-auto size-10 opacity-50"
			/>
			<p className="text-foreground Header4 mt-4">No tenés notificaciones</p>
			<p className="text-muted-foreground TextRegluar mt-1">
				Cuando alguien te siga, te recomiende una canción o te invite a una
				playlist, va a aparecer acá.
			</p>
		</div>
	);
}
