import { useCallback, useEffect, useRef, useState } from 'react'

import { REORDER_DEBOUNCE_MS } from './reorderConfig.js'

/**
 * Reordenamiento optimista con debounce, una petición en vuelo y rollback.
 *
 * Recibe la función de guardado (`saveOrder`) inyectada, así sirve para
 * playlists y para favoritos. El componente solo dispara `reorder(nextOrder)`;
 * este hook se encarga del debounce, el flush y la reconciliación con el
 * backend (`merged`).
 *
 * @param {object} params
 * @param {number[]} params.initialOrder Orden inicial (ids).
 * @param {(songIds: number[], options?: { keepalive?: boolean }) => Promise<{ songIds: number[], merged: boolean }>} params.saveOrder
 * @param {number} [params.debounceMs]
 * @param {(songIds: number[]) => void} [params.onMerged]
 * @param {(error: unknown) => void} [params.onError]
 */
export default function useReorderSongs({
  initialOrder,
  saveOrder,
  debounceMs = REORDER_DEBOUNCE_MS,
  onMerged,
  onError,
}) {
  const [order, setOrder] = useState(initialOrder ?? [])
  const [saving, setSaving] = useState(false)

  const confirmedRef = useRef(initialOrder ?? [])
  const pendingRef = useRef(null)
  const timerRef = useRef(null)
  const inFlightRef = useRef(false)
  const saveOrderRef = useRef(saveOrder)
  const onMergedRef = useRef(onMerged)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    saveOrderRef.current = saveOrder
  }, [saveOrder])
  useEffect(() => {
    onMergedRef.current = onMerged
  }, [onMerged])
  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    setOrder(initialOrder ?? [])
    confirmedRef.current = initialOrder ?? []
  }, [initialOrder])

  const send = useCallback(async (ids, { keepalive } = {}) => {
    inFlightRef.current = true
    setSaving(true)
    try {
      const result = await saveOrderRef.current(ids, { keepalive })
      const next = result?.songIds ?? ids
      confirmedRef.current = next
      setOrder(next)
      if (result?.merged && typeof onMergedRef.current === 'function') {
        onMergedRef.current(next)
      }
    } catch (error) {
      setOrder(confirmedRef.current)
      if (typeof onErrorRef.current === 'function') onErrorRef.current(error)
    } finally {
      inFlightRef.current = false
      setSaving(false)
      if (pendingRef.current) {
        const next = pendingRef.current
        pendingRef.current = null
        send(next)
      }
    }
  }, [])

  const schedule = useCallback(
    (ids) => {
      pendingRef.current = ids
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        const toSend = pendingRef.current
        pendingRef.current = null
        if (!toSend) return
        if (inFlightRef.current) {
          pendingRef.current = toSend
        } else {
          send(toSend)
        }
      }, debounceMs)
    },
    [debounceMs, send],
  )

  const reorder = useCallback(
    (next) => {
      setOrder(next)
      schedule(next)
    },
    [schedule],
  )

  const flush = useCallback(
    async ({ keepalive } = {}) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      const toSend = pendingRef.current
      pendingRef.current = null
      if (!toSend) return
      if (inFlightRef.current) {
        pendingRef.current = toSend
        return
      }
      await send(toSend, { keepalive })
    },
    [send],
  )

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { order, reorder, flush, saving }
}
