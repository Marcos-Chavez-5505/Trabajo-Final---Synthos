import * as React from "react"

type AnyProps = Record<string, unknown>
type PropsGetter = (props: AnyProps) => AnyProps

function mergeClassNames(ours: unknown, theirs: unknown) {
  if (theirs) {
    if (ours) {
      return `${String(theirs)} ${String(ours)}`
    }
    return String(theirs)
  }
  return ours as string | undefined
}

function mergeStyles(ours: unknown, theirs: unknown) {
  if (!ours) {
    return theirs
  }
  if (!theirs) {
    return ours
  }
  return { ...(ours as object), ...(theirs as object) }
}

function makeEventPreventable(event: {
  preventBaseUIHandler?: () => void
  baseUIHandlerPrevented?: boolean
}) {
  event.preventBaseUIHandler = () => {
    event.baseUIHandlerPrevented = true
  }
}

function mergeEventHandlers(ours: unknown, theirs: unknown) {
  if (!theirs) {
    return ours
  }
  if (!ours) {
    return theirs
  }

  return (...args: unknown[]) => {
    const event = args[0] as
      | (Event & { baseUIHandlerPrevented?: boolean })
      | undefined

    if (event && typeof event === "object" && "nativeEvent" in event) {
      makeEventPreventable(event)
      const result = (theirs as Function)(...args)
      if (!event.baseUIHandlerPrevented) {
        ;(ours as Function)(...args)
      }
      return result
    }

    const result = (theirs as Function)(...args)
    ;(ours as Function)(...args)
    return result
  }
}

function isEventHandler(key: string, value: unknown) {
  const code0 = key.charCodeAt(0)
  const code1 = key.charCodeAt(1)
  const code2 = key.charCodeAt(2)
  return (
    code0 === 111 /* o */ &&
    code1 === 110 /* n */ &&
    code2 >= 65 /* A */ &&
    code2 <= 90 /* Z */ &&
    (typeof value === "function" || typeof value === "undefined")
  )
}

/**
 * Mergea props igual que el `mergeProps` de Base UI: el objeto de la derecha
 * pisa al de la izquierda, salvo `className` (se concatenan), `style` (se
 * mezclan) y los handlers `on*` (se encadenan). Los handlers corren de derecha
 * a izquierda y el de la derecha puede cortar al resto con
 * `event.preventBaseUIHandler()`.
 */
export function mergeProps<T extends React.ElementType>(
  ...inputs: Array<React.ComponentPropsWithRef<T> | PropsGetter | undefined>
): React.ComponentPropsWithRef<T> {
  let merged: AnyProps = {}

  for (const input of inputs) {
    if (!input) {
      continue
    }

    if (typeof input === "function") {
      merged = input(merged)
      continue
    }

    for (const key in input) {
      const value = (input as AnyProps)[key]

      if (key === "style") {
        merged.style = mergeStyles(merged.style, value)
      } else if (key === "className") {
        merged.className = mergeClassNames(merged.className, value)
      } else if (isEventHandler(key, value)) {
        merged[key] = mergeEventHandlers(merged[key], value)
      } else {
        merged[key] = value
      }
    }
  }

  return merged as React.ComponentPropsWithRef<T>
}

export type RenderProp<State = AnyProps> =
  | React.ReactElement
  | ((props: AnyProps, state: State) => React.ReactNode)

export interface UseRenderParams<State extends AnyProps = AnyProps> {
  /** Elemento o función que reemplaza al tag por defecto. */
  render?: RenderProp<State>
  /** Props a aplicar al elemento; se mergean con las de `state`. */
  props?: AnyProps
  /** Estado del componente; cada clave truthy sale como `data-<clave>`. */
  state?: State
  /** Tag a usar cuando no hay `render`. */
  defaultTagName?: keyof React.JSX.IntrinsicElements
  enabled?: boolean
}

/**
 * Reemplazo local de `useRender` de Base UI: resuelve el prop `render`
 * (elemento o función), agrega los `data-*` derivados de `state` y mergea las
 * props. Con `defaultTagName="button"` agrega `type="button"`, igual que Base
 * UI, para no romper formularios.
 */
export function useRender<State extends AnyProps = AnyProps>({
  render,
  props,
  state,
  defaultTagName = "div",
  enabled = true,
}: UseRenderParams<State>): React.ReactElement | null {
  if (!enabled) {
    return null
  }

  const stateProps: AnyProps = {}
  if (state) {
    for (const key in state) {
      const value = state[key]
      if (value === true) {
        stateProps[`data-${key.toLowerCase()}`] = ""
      } else if (value) {
        stateProps[`data-${key.toLowerCase()}`] = String(value)
      }
    }
  }

  const merged = mergeProps(stateProps, props)

  if (render) {
    if (typeof render === "function") {
      return render(merged, state ?? ({} as State)) as React.ReactElement
    }

    const renderProps = mergeProps(merged, render.props)
    renderProps.ref = merged.ref as React.Ref<Element> | undefined
    return React.cloneElement(render, renderProps)
  }

  if (defaultTagName === "button") {
    return React.createElement("button", { type: "button", ...merged })
  }
  if (defaultTagName === "img") {
    return React.createElement("img", { alt: "", ...merged })
  }

  return React.createElement(defaultTagName as React.ElementType, merged)
}

export declare namespace useRender {
  type ComponentProps<T extends React.ElementType> =
    React.ComponentPropsWithRef<T> & {
      render?: RenderProp
    }
}
