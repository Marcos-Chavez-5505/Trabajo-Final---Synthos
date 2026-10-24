import { get, patch } from './api.js'

/**
 * Servicio de notificaciones.
 * Todas las llamadas van por `api.js` para mantener token, baseUrl,
 * manejo de 401 y errores unificados.
 */
export async function listNotifications({ page = 1, pageSize = 20 } = {}) {
	return get('/notifications', { params: { page, pageSize } })
}

export async function markNotificationRead(id) {
	return patch(`/notifications/${id}/read`)
}

export async function markAllNotificationsRead() {
	return patch('/notifications/read-all')
}
