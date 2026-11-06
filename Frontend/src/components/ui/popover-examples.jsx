import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"

// Ejemplos de `/components` (pagina de prueba, sin vinculos en el sidebar).
// Cubren el trigger con `render` (Base UI: no existe `asChild`), contenido
// informativo y un formulario corto con estado controlado.

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="TextMedium text-muted-foreground">{label}</span>
      <span className="TextMedium">{value}</span>
    </div>
  )
}

export function PopoverExampleInfo() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        Calidad de audio
      </PopoverTrigger>
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverTitle>Calidad de audio</PopoverTitle>
          <PopoverDescription>
            Se aplica a la reproduccion en este dispositivo.
          </PopoverDescription>
        </PopoverHeader>
        <Row label="Streaming" value="Alta" />
        <Row label="Descargas" value="Automatica" />
      </PopoverContent>
    </Popover>
  )
}

export function PopoverExampleForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("Mis favoritas")
  const [savedName, setSavedName] = useState("")

  return (
    <div className="flex flex-col items-start gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button variant="outline" />}>
          Renombrar playlist
        </PopoverTrigger>
        <PopoverContent align="start">
          <PopoverHeader>
            <PopoverTitle>Renombrar playlist</PopoverTitle>
            <PopoverDescription>
              El nombre se actualiza en tu biblioteca.
            </PopoverDescription>
          </PopoverHeader>
          <form
            className="flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              setSavedName(name.trim())
              setOpen(false)
            }}
          >
            <label htmlFor="popover-playlist-name" className="TextMedium">
              Nombre
            </label>
            <Input
              id="popover-playlist-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
      {savedName && (
        <p className="TextTiny text-muted-foreground">Guardado: {savedName}</p>
      )}
    </div>
  )
}
