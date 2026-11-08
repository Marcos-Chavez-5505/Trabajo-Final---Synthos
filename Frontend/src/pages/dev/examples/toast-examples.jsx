import { listPopularSongs } from "@synthos/shared"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"

// Ejemplos de `/components` (página de prueba, sin vínculos en el sidebar).
// Ejercitan las tres operaciones del manager contra la API real para ver el
// ciclo loading → success/error y el cambio en el lugar.

function errorMessage(error) {
  return error instanceof Error ? error.message : "Intentá de nuevo."
}

export function ToastExampleAdd() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <Button
        variant="outline"
        onClick={() =>
          toast.add({
            type: "success",
            title: "Listo",
            description: "Notificación creada con toast.add.",
          })
        }
      >
        toast.add (success)
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.add({
            type: "error",
            title: "Algo salió mal",
            description: "Notificación creada con tipo error.",
          })
        }
      >
        toast.add (error)
      </Button>
    </div>
  )
}

export function ToastExamplePromise() {
  const run = () => {
    void toast
      .promise(listPopularSongs(), {
        loading: {
          type: "loading",
          title: "Cargando populares…",
          description: "Consultando la API.",
        },
        success: (songs) => ({
          type: "success",
          title: "Populares cargadas",
          description: `${songs.length} canciones recibidas.`,
        }),
        error: (error) => ({
          type: "error",
          title: "No se pudieron cargar",
          description: errorMessage(error),
        }),
      })
      .catch(() => {})
  }

  return (
    <Button variant="outline" onClick={run}>
      toast.promise
    </Button>
  )
}

export function ToastExampleUpdate() {
  const run = async () => {
    const id = toast.add({
      type: "loading",
      title: "Sincronizando…",
      description: "Esperando la API.",
      timeout: 0,
    })

    try {
      const songs = await listPopularSongs()
      toast.update(id, {
        type: "success",
        title: "Sincronizado",
        description: `${songs.length} canciones en la lista.`,
        timeout: 4000,
      })
    } catch (error) {
      toast.update(id, {
        type: "error",
        title: "Falló la sincronización",
        description: errorMessage(error),
        timeout: 6000,
      })
    }
  }

  return (
    <Button variant="outline" onClick={run}>
      toast.update
    </Button>
  )
}
