import { useCallback, useEffect, useRef, useState } from 'react'
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import hamburgerMenuIcon from '@synthos/shared/assets/icons/hamburger_menu.svg'
import fullHeartIcon from '@synthos/shared/assets/icons/full_heart.svg'
import musicNoteIcon from '@synthos/shared/assets/icons/music_note.svg'
import Ellipsis from '@synthos/shared/assets/icons/ellipsis.svg'
import trashIcon from '@synthos/shared/assets/icons/trash.svg'
import AddToQueueButton from '../../components/player/AddToQueueButton.jsx'

const RAIL_WIDTH = 96
const SHIFT = 24
const OVERLAP = 12
const SHRINK = RAIL_WIDTH - OVERLAP - SHIFT
const RIGHT_REVEAL = RAIL_WIDTH - OVERLAP

const SETTLE = {
  type: 'spring',
  stiffness: 560,
  damping: 48,
  mass: 0.82,
  restDelta: 0.5,
  restSpeed: 8,
}
const OPEN_RATIO = 0.46
const CLOSE_RATIO = 0.72
const OPEN_VELOCITY = 720
const CLOSE_VELOCITY = 320
const VELOCITY_LIMIT = 1500

const NEUTRAL_KEYS = new Set(['Tab', 'Shift', 'Control', 'Alt', 'Meta'])

const clampVelocity = (v) => Math.max(-VELOCITY_LIMIT, Math.min(VELOCITY_LIMIT, v))

export default function PlaylistSongRow({
  song,
  index,
  total = 0,
  isFavorite,
  onPlay,
  onRemove,
  onMoveTo,
  canRemove = true,
  canReorder = false,
  onDragHandlePointerDown,
}) {
  const reduce = useReducedMotion()
  const wrapperRef = useRef(null)
  const dotsButtonRef = useRef(null)
  const removeButtonRef = useRef(null)
  const indexInputRef = useRef(null)
  const skipCommitRef = useRef(false)
  const animationRef = useRef(null)
  const didDragRef = useRef(false)
  const dragControls = useDragControls()
  const [openSide, setOpenSide] = useState(null)
  const [indexDraft, setIndexDraft] = useState(null)
  const indexValue = indexDraft ?? String(index + 1)

  const x = useMotionValue(0)

  // Progreso 0..1 igual para ambos lados: los dos recorren RIGHT_REVEAL px de arrastre,
  // así la fricción y los umbrales se sienten idénticos a izquierda y derecha.
  const progress = useTransform(x, (v) => Math.min(1, Math.abs(v) / RIGHT_REVEAL))

  const width = useTransform(progress, (p) => `calc(100% - ${SHRINK * p}px)`)

  // A la izquierda, x recorre RIGHT_REVEAL px pero el borde izquierdo de la tarjeta
  // solo debe desplazarse SHIFT px. Se compensa con marginLeft: el resultado visual
  // es el mismo de antes, pero con el mismo recorrido de dedo que la derecha.
  const marginLeft = useTransform(x, (v) => {
    if (v >= 0) return 0
    const p = Math.min(1, -v / RIGHT_REVEAL)
    return SHRINK * p
  })

  // Cada riel se dibuja solo cuando la tarjeta se corre hacia su lado.
  const railOpacity = useTransform(x, [-6, 0], [1, 0])
  const indexRailOpacity = useTransform(x, [0, 6], [0, 1])

  const settle = useCallback(
    (target, velocity = 0) => {
      animationRef.current?.stop()
      if (reduce) {
        x.set(target)
        return
      }
      animationRef.current = animate(x, target, {
        ...SETTLE,
        velocity: clampVelocity(velocity),
      })
    },
    [reduce, x]
  )

  const settleSide = useCallback(
    (side, velocity = 0) => {
      if (side !== 'index') setIndexDraft(null)
      setOpenSide(side)
      settle(side === 'remove' ? -RIGHT_REVEAL : side === 'index' ? RIGHT_REVEAL : 0, velocity)
    },
    [settle]
  )

  const close = useCallback(() => {
    setIndexDraft(null)
    if (indexInputRef.current && document.activeElement === indexInputRef.current) {
      // El blur que dispara este cierre no debe volver a confirmar el valor.
      skipCommitRef.current = true
      indexInputRef.current.blur()
    }
    settleSide(null)
  }, [settleSide])

  useEffect(() => () => animationRef.current?.stop(), [])

  // Si pierde el permiso de su lado mientras está abierta, se cierra.
  useEffect(() => {
    if (openSide === 'remove' && !canRemove) close()
    else if (openSide === 'index' && !canReorder) close()
  }, [canRemove, canReorder, openSide, close])

  // Mientras está abierta, cualquier otra acción la cierra de inmediato.
  useEffect(() => {
    if (!openSide) return undefined

    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) close()
    }

    const handleKeyDown = (event) => {
      // Los dígitos, Enter y Escape del input no deben cerrar el riel.
      if (event.target === indexInputRef.current) return
      if (NEUTRAL_KEYS.has(event.key)) return
      // Enter/Espacio sobre los botones propios los activa (quitar o alternar).
      const isOwnButton =
        event.target === removeButtonRef.current || event.target === dotsButtonRef.current
      if (isOwnButton && (event.key === 'Enter' || event.key === ' ')) return
      close()
    }

    const handleAway = () => {
      // Mientras se edita la posición, el teclado virtual puede redimensionar.
      if (indexInputRef.current && document.activeElement === indexInputRef.current) return
      close()
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('scroll', handleAway, true)
    window.addEventListener('wheel', handleAway, { passive: true })
    window.addEventListener('resize', handleAway)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('scroll', handleAway, true)
      window.removeEventListener('wheel', handleAway)
      window.removeEventListener('resize', handleAway)
    }
  }, [openSide, close])

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    onPlay()
  }

  // El drag arranca a mano para no pelearse con los botones (incluida la manija de
  // reordenar, que tiene su propio drag vertical).
  const handleSurfacePointerDown = (event) => {
    if (!canRemove && !canReorder) return
    if (event.target.closest('button, a, input')) return
    dragControls.start(event)
  }

  const handleDragStart = () => {
    didDragRef.current = true
    animationRef.current?.stop()
    document.body.style.userSelect = 'none'
  }

  const handleDragEnd = (_, info) => {
    document.body.style.userSelect = ''
    const latest = x.get()
    const velocity = info.velocity.x
    let side = null

    if (latest <= 0) {
      const wasOpen = openSide === 'remove'
      const shouldOpen = wasOpen
        ? !(latest > -RIGHT_REVEAL * CLOSE_RATIO || velocity > CLOSE_VELOCITY)
        : latest < -RIGHT_REVEAL * OPEN_RATIO || (velocity < -OPEN_VELOCITY && latest < -3)
      side = shouldOpen ? 'remove' : null
    } else {
      const wasOpen = openSide === 'index'
      const shouldOpen = wasOpen
        ? !(latest < RIGHT_REVEAL * CLOSE_RATIO || velocity < -CLOSE_VELOCITY)
        : latest > RIGHT_REVEAL * OPEN_RATIO || (velocity > OPEN_VELOCITY && latest > 3)
      side = shouldOpen ? 'index' : null
    }

    settleSide(side, velocity)

    // El click del navegador llega justo después de soltar: lo ignoramos.
    setTimeout(() => {
      didDragRef.current = false
    }, 60)
  }

  const handleSurfaceClickCapture = (event) => {
    if (didDragRef.current) {
      event.stopPropagation()
      event.preventDefault()
      return
    }
    // Tocar cualquier otra cosa de la tarjeta (menos los 3 puntitos) la cierra.
    if (openSide && !dotsButtonRef.current?.contains(event.target)) close()
  }

  const handleIndexChange = (event) => {
    const next = event.target.value
    if (!/^\d*$/.test(next)) {
      event.target.value = indexValue
      return
    }
    setIndexDraft(next)
  }

  const commitIndex = () => {
    const digits = indexValue.replace(/\D/g, '')
    const parsed = digits ? Number(digits) : NaN
    const maxIndex = Math.max(1, total)

    // Vacío o 0: no es una posición válida, se cierra sin mover.
    if (Number.isNaN(parsed) || parsed < 1) {
      close()
      return
    }

    // Los números gigantes (o Infinity) caen en la última posición.
    const target = Math.min(maxIndex, Math.trunc(parsed))
    const current = index + 1

    close()

    if (target !== current) onMoveTo?.(target)
  }

  const handleIndexKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      commitIndex()
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      close()
    }
  }

  const handleIndexBlur = () => {
    if (skipCommitRef.current) {
      skipCommitRef.current = false
      return
    }

    commitIndex()
    skipCommitRef.current = false
  }

  const handleRemove = () => {
    close()
    onRemove()
  }

  return (
    <div ref={wrapperRef} className="relative isolate my-0.5">
      {canReorder && (
        <motion.div
          className={`CardRadius absolute inset-y-0 left-0 overflow-hidden ${openSide === 'index' ? '' : 'pointer-events-none'}`}
          style={{ width: RAIL_WIDTH, opacity: indexRailOpacity }}
          aria-hidden={openSide !== 'index'}
        >
          <div
            className="Volume flex h-full w-full items-center justify-center"
            style={{ paddingRight: OVERLAP }}
          >
            <input
              ref={indexInputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              spellCheck={false}
              value={indexValue}
              onChange={handleIndexChange}
              onKeyDown={handleIndexKeyDown}
              onBlur={handleIndexBlur}
              onFocus={(event) => event.target.select()}
              enterKeyHint="done"
              tabIndex={openSide === 'index' ? 0 : -1}
              aria-label={`Posición de ${song.title}, entre 1 y ${Math.max(1, total)}`}
              title="Mover a la posición"
              className="h-8 w-14 rounded border border-input bg-transparent p-0 text-center TextMedium text-foreground outline-none focus:border-ring"
            />
          </div>
        </motion.div>
      )}

      {canRemove && (
        <motion.div
          className={`CardRadius absolute inset-y-0 right-0 overflow-hidden ${openSide === 'remove' ? '' : 'pointer-events-none'}`}
          style={{ width: RAIL_WIDTH, opacity: railOpacity }}
          aria-hidden={openSide !== 'remove'}
        >
          <button
            ref={removeButtonRef}
            type="button"
            onClick={handleRemove}
            tabIndex={openSide === 'remove' ? 0 : -1}
            aria-label={`Sacar ${song.title} de la playlist`}
            title="Sacar de la playlist"
            // El padding izquierdo centra el ícono en la parte visible (la que no tapa la tarjeta).
            style={{ paddingLeft: OVERLAP }}
            className="flex h-full w-full items-center justify-center Red text-(--ds-lighter) hover:brightness-110"
          >
            <img src={trashIcon} alt="" aria-hidden="true" className="h-5 w-5" />
          </button>
        </motion.div>
      )}

      <motion.article
        drag={canRemove || canReorder ? 'x' : false}
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{
          left: canRemove ? -RIGHT_REVEAL : 0,
          right: canReorder ? RIGHT_REVEAL : 0,
        }}
        dragElastic={0}
        dragMomentum={false}
        onPointerDown={handleSurfacePointerDown}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClickCapture={handleSurfaceClickCapture}
        style={{ x, width, marginLeft }}
        className="SurfaceLight CardRadius relative z-10 flex touch-pan-y items-center gap-3 px-3 py-2"
      >
        {canReorder && (
          <button
            type="button"
            onPointerDown={(event) => {
              if (openSide) close()
              onDragHandlePointerDown?.(event)
            }}
            aria-label={`Mover ${song.title}`}
            title="Arrastrar para reordenar"
            className="shrink-0 cursor-grab touch-none rounded px-1 py-1"
          >
            <img src={hamburgerMenuIcon} alt="" aria-hidden="true" className="h-4 w-4" />
          </button>
        )}

        <div
          onClick={onPlay}
          role="button"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="Light CardRadius h-10 w-10 shrink-0 cursor-pointer overflow-hidden"
        >
          {song.coverUrl ? (
            <img
              src={song.coverUrl}
              alt={`Carátula de ${song.title}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <img src={musicNoteIcon} alt="" aria-hidden="true" className="h-4 w-4 invert opacity-60" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-foreground TextRegluar truncate">{song.title}</p>
          <p className="text-muted-foreground TextMedium truncate">{song.artist}</p>
        </div>

        {isFavorite && (
          <div className=''>
            <img
              src={fullHeartIcon}
              alt="Es una de tus favoritas"
              title="Es una de tus favoritas"
              className="h-4 w-4 shrink-0"
            />
          </div>
        )}

        <AddToQueueButton song={song} iconClassName="h-4 w-4" />

        {canRemove && (
          <button
            ref={dotsButtonRef}
            type="button"
            onClick={() => settleSide(openSide === 'remove' ? null : 'remove')}
            aria-label={`Más acciones para ${song.title}`}
            aria-expanded={openSide === 'remove'}
            title="Más acciones"
            className="shrink-0 rounded px-1 py-1 hover:opacity-70"
          >
            <img src={Ellipsis} alt="" aria-hidden="true" className="h-5 w-5" />
          </button>
        )}
      </motion.article>
    </div>
  )
}