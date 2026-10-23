import * as React from "react"
import {
  arrow as arrowMiddleware,
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
} from "@floating-ui/react-dom"

const PHYSICAL_SIDES = {
  top: "top",
  right: "right",
  bottom: "bottom",
  left: "left",
  "inline-start": "left",
  "inline-end": "right",
}

function getPlacement(side, align) {
  const physicalSide = PHYSICAL_SIDES[side] ?? "bottom"
  return align === "center" ? physicalSide : `${physicalSide}-${align}`
}

/** `transform-origin` que Base UI exponía como `--transform-origin`. */
export function getTransformOrigin(side, align) {
  const x =
    side === "left" || side === "right"
      ? side === "left"
        ? "right"
        : "left"
      : align === "start"
        ? "left"
        : align === "end"
          ? "right"
          : "center"

  const y =
    side === "top" || side === "bottom"
      ? side === "top"
        ? "bottom"
        : "top"
      : align === "start"
        ? "top"
        : align === "end"
          ? "bottom"
          : "center"

  return `${x} ${y}`
}

/**
 * Posicionamiento anclado con Floating UI. Devuelve el `setFloating`, los
 * estilos del positioner, el lado/alineación resueltos después del flip y el
 * estilo del arrow. El positioner es el que recibe `--available-height` y
 * `--transform-origin`, que los popups heredan.
 */
export function useAnchoredPosition({
  open,
  anchor,
  side = "bottom",
  align = "center",
  sideOffset = 0,
  alignOffset = 0,
  collisionPadding = 8,
  arrowRef,
}) {
  const middleware = React.useMemo(() => {
    const list = [
      offset({
        mainAxis: sideOffset,
        crossAxis: alignOffset,
        alignmentAxis: alignOffset,
      }),
      flip({ padding: collisionPadding }),
      shift({ padding: collisionPadding }),
      size({
        padding: collisionPadding,
        apply({ availableHeight, availableWidth, elements }) {
          elements.floating.style.setProperty(
            "--available-height",
            `${Math.max(0, availableHeight)}px`
          )
          elements.floating.style.setProperty(
            "--available-width",
            `${Math.max(0, availableWidth)}px`
          )
        },
      }),
    ]

    if (arrowRef) {
      list.push(arrowMiddleware({ element: arrowRef, padding: 4 }))
    }

    return list
  }, [sideOffset, alignOffset, collisionPadding, arrowRef])

  const {
    refs,
    floatingStyles,
    placement,
    middlewareData,
    isPositioned,
  } = useFloating({
    open,
    placement: getPlacement(side, align),
    strategy: "absolute",
    whileElementsMounted: autoUpdate,
    middleware,
  })

  React.useEffect(() => {
    refs.setReference(anchor ?? null)
  }, [anchor, refs])

  const [resolvedSide, resolvedAlign = "center"] = placement.split("-")
  const arrowStyle = React.useMemo(() => {
    const arrowData = middlewareData.arrow
    if (!arrowData) return undefined
    return {
      position: "absolute",
      left: arrowData.x,
      top: arrowData.y,
    }
  }, [middlewareData.arrow])

  return {
    setFloating: refs.setFloating,
    floatingStyles,
    side: resolvedSide,
    align: resolvedAlign,
    arrowStyle,
    isPositioned,
  }
}
