import { createContext, useContext } from 'react'
import useNotifications from '../features/notifications/useNotifications.js'

const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
	const value = useNotifications()

	return (
		<NotificationsContext.Provider value={value}>
			{children}
		</NotificationsContext.Provider>
	)
}

export function useNotificationsContext() {
	const ctx = useContext(NotificationsContext)
	if (!ctx) {
		throw new Error('useNotificationsContext debe usarse dentro de NotificationsProvider')
	}
	return ctx
}

export function useUnreadNotificationsCount() {
	const { unreadCount } = useNotificationsContext()
	return unreadCount
}
