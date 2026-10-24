import { useNotificationsContext } from '@synthos/shared'
import NotificationRow from './NotificationRow.jsx'
import notificationIcon from '../../assets/notification.svg'

/**
 * `/notificaciones`: bandeja de novedades conectada al backend.
 *
 * Usa `GET /api/notifications`, `PATCH /api/notifications/:id/read`,
 * `PATCH /api/notifications/read-all` y escucha los eventos `notification:new`,
 * `notification:read`, `notification:read-all` por el socket existente.
 */
export default function Notifications() {
	const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
		useNotificationsContext()

	if (loading && notifications.length === 0) {
		return (
			<section className="px-4 py-4 sm:px-6 md:px-10">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div>
						<h1 className="Header3">Notificaciones</h1>
						<p className="text-muted-foreground TextRegluar mt-1">
							Cargando notificaciones...
						</p>
					</div>
				</div>
			</section>
		)
	}

	return (
		<section className="px-4 py-4 sm:px-6 md:px-10">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="Header3">Notificaciones</h1>
					<p className="text-muted-foreground TextRegluar mt-1">
						{unreadCount > 0
							? `Tenés ${unreadCount} ${
									unreadCount === 1
										? 'notificación nueva'
										: 'notificaciones nuevas'
								}.`
							: 'Estás al día. Acá van a aparecer las novedades de tu cuenta.'}
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
	)
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
	)
}
