import { useCallback, useEffect, useRef, useState } from 'react'
import { connectSocket, getSocket } from '../../services/socketService.js'
import { getAuthToken } from '../../services/api.js'
import {
	listNotifications,
	markAllNotificationsRead,
	markNotificationRead,
} from '../../services/notificationsService.js'

export default function useNotifications({ pageSize = 20 } = {}) {
	const [notifications, setNotifications] = useState([])
	const [unreadCount, setUnreadCount] = useState(0)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const mounted = useRef(true)
	const tokenRef = useRef(getAuthToken())

	const fetchNotifications = useCallback(async () => {
		const token = getAuthToken()
		if (!token) {
			if (!mounted.current) return
			setNotifications([])
			setUnreadCount(0)
			setLoading(false)
			setError(null)
			return
		}

		try {
			setLoading(true)
			setError(null)
			const res = await listNotifications({ page: 1, pageSize })
			if (!mounted.current) return
			setNotifications(res?.notifications ?? [])
			setUnreadCount(res?.unreadCount ?? 0)
		} catch (err) {
			if (!mounted.current) return
			setError(err)
		} finally {
			if (mounted.current) setLoading(false)
		}
	}, [pageSize])

	const markAsRead = useCallback(
		async (id) => {
			const token = getAuthToken()
			if (!token) return

			// Optimista para evitar parpadeo
			setNotifications((prev) =>
				prev.map((notification) =>
					notification.id === id
						? { ...notification, isRead: true }
						: notification,
				),
			)
			setUnreadCount((prev) => Math.max(0, prev - 1))

			try {
				const res = await markNotificationRead(id)
				if (!mounted.current) return
				if (typeof res?.unreadCount === 'number') {
					setUnreadCount(res.unreadCount)
				}
			} catch (err) {
				// Si falla, vuelvo al estado real del backend
				fetchNotifications()
			}
		},
		[fetchNotifications],
	)

	const markAllAsRead = useCallback(async () => {
		const token = getAuthToken()
		if (!token) return

		const previousNotifications = notifications
		const previousUnreadCount = unreadCount

		setNotifications((prev) =>
			prev.map((notification) => ({ ...notification, isRead: true })),
		)
		setUnreadCount(0)

		try {
			const res = await markAllNotificationsRead()
			if (!mounted.current) return
			if (typeof res?.unreadCount === 'number') {
				setUnreadCount(res.unreadCount)
			}
		} catch (err) {
			if (!mounted.current) return
			setNotifications(previousNotifications)
			setUnreadCount(previousUnreadCount)
		}
	}, [notifications, unreadCount])

	useEffect(() => {
		mounted.current = true
		fetchNotifications()
		connectSocket()

		const onNew = (notification) => {
			if (!mounted.current) return
			setNotifications((prev) => {
				if (prev.some((n) => n.id === notification.id)) return prev
				return [notification, ...prev]
			})
			setUnreadCount((prev) => prev + 1)
		}

		const onRead = ({ unreadCount: count }) => {
			if (!mounted.current) return
			if (typeof count === 'number') setUnreadCount(count)
		}

		const onReadAll = ({ unreadCount: count }) => {
			if (!mounted.current) return
			setNotifications((prev) =>
				prev.map((notification) => ({ ...notification, isRead: true })),
			)
			if (typeof count === 'number') setUnreadCount(count)
		}

		const attachListeners = (socket) => {
			if (!socket) return
			socket.off('notification:new', onNew)
			socket.off('notification:read', onRead)
			socket.off('notification:read-all', onReadAll)
			socket.on('notification:new', onNew)
			socket.on('notification:read', onRead)
			socket.on('notification:read-all', onReadAll)
		}

		attachListeners(getSocket())

		const onConnect = () => {
			attachListeners(getSocket())
		}

		const onDisconnect = () => {
			// no-op
		}

		const socket = getSocket()
		if (socket) {
			socket.on('connect', onConnect)
			socket.on('disconnect', onDisconnect)
		}

		// Poll para detectar login/logout (el token se setea desde AuthProvider)
		const interval = setInterval(() => {
			const token = getAuthToken()
			if (token !== tokenRef.current) {
				tokenRef.current = token
				fetchNotifications()
				connectSocket()
				attachListeners(getSocket())
			}
			if (!getSocket()) {
				connectSocket()
			}
			attachListeners(getSocket())
		}, 1000)

		return () => {
			mounted.current = false
			clearInterval(interval)
			const s = getSocket()
			if (s) {
				s.off('connect', onConnect)
				s.off('disconnect', onDisconnect)
				s.off('notification:new', onNew)
				s.off('notification:read', onRead)
				s.off('notification:read-all', onReadAll)
			}
		}
	}, [fetchNotifications])

	return {
		notifications,
		unreadCount,
		loading,
		error,
		markAsRead,
		markAllAsRead,
		refresh: fetchNotifications,
	}
}
