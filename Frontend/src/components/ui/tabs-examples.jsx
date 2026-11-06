import { useState } from "react"

import albumIcon from "@synthos/shared/assets/icons/album.svg"
import bellIcon from "@synthos/shared/assets/icons/bell.svg"
import fullHeartIcon from "@synthos/shared/assets/icons/full_heart.svg"
import houseIcon from "@synthos/shared/assets/icons/house.svg"
import musicNoteIcon from "@synthos/shared/assets/icons/music_note.svg"
import playlistIcon from "@synthos/shared/assets/icons/playlist.svg"
import searchIcon from "@synthos/shared/assets/icons/search.svg"
import userIcon from "@synthos/shared/assets/icons/user.svg"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Ejemplos de `/components` (pagina de prueba, sin vinculos en el sidebar).
// Cubren los tres casos que debe resolver el componente: uso no controlado,
// uso controlado con `icons="selected"` y overflow en un contenedor angosto.

function TabIcon({ src }) {
  return <img src={src} alt="" aria-hidden="true" className="size-4" />
}

function Panel({ children }) {
  return <p className="TextMedium text-muted-foreground">{children}</p>
}

export function TabsExampleUncontrolled() {
  return (
    <Tabs defaultValue="inicio">
      <TabsList>
        <TabsTrigger value="inicio" icon={<TabIcon src={houseIcon} />}>
          Inicio
        </TabsTrigger>
        <TabsTrigger value="buscar" icon={<TabIcon src={searchIcon} />}>
          Buscar
        </TabsTrigger>
        <TabsTrigger value="favoritos" icon={<TabIcon src={fullHeartIcon} />}>
          Favoritos
        </TabsTrigger>
      </TabsList>
      <TabsContent value="inicio">
        <Panel>Contenido de Inicio. El valor inicial lo define `defaultValue`.</Panel>
      </TabsContent>
      <TabsContent value="buscar">
        <Panel>Contenido de Buscar. Cada panel conserva su propio estado.</Panel>
      </TabsContent>
      <TabsContent value="favoritos">
        <Panel>Contenido de Favoritos. Navegacion con flechas, Home y End.</Panel>
      </TabsContent>
    </Tabs>
  )
}

export function TabsExampleControlled() {
  const [value, setValue] = useState("albumes")

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Tabs value={value} onValueChange={setValue} icons="selected">
        <TabsList>
          <TabsTrigger value="albumes" icon={<TabIcon src={albumIcon} />}>
            Albumes
          </TabsTrigger>
          <TabsTrigger value="canciones" icon={<TabIcon src={musicNoteIcon} />}>
            Canciones
          </TabsTrigger>
          <TabsTrigger value="artistas" icon={<TabIcon src={userIcon} />}>
            Artistas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="albumes">
          <Panel>Vista de Albumes.</Panel>
        </TabsContent>
        <TabsContent value="canciones">
          <Panel>Vista de Canciones.</Panel>
        </TabsContent>
        <TabsContent value="artistas">
          <Panel>Vista de Artistas.</Panel>
        </TabsContent>
      </Tabs>
      <p className="TextTiny text-muted-foreground">Valor controlado: {value}</p>
    </div>
  )
}

export function TabsExampleOverflow() {
  return (
    <div style={{ maxWidth: 280 }}>
      <Tabs defaultValue="playlists">
        <TabsList>
          <TabsTrigger value="playlists" icon={<TabIcon src={playlistIcon} />}>
            Playlists
          </TabsTrigger>
          <TabsTrigger value="notificaciones" icon={<TabIcon src={bellIcon} />}>
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="canciones" icon={<TabIcon src={musicNoteIcon} />}>
            Canciones
          </TabsTrigger>
          <TabsTrigger value="artistas" icon={<TabIcon src={userIcon} />}>
            Artistas
          </TabsTrigger>
          <TabsTrigger value="albumes" icon={<TabIcon src={albumIcon} />}>
            Albumes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="playlists">
          <Panel>En pantalla angosta aparecen las flechas de overflow.</Panel>
        </TabsContent>
        <TabsContent value="notificaciones">
          <Panel>Las flechas desplazan la lista y se deshabilitan en los extremos.</Panel>
        </TabsContent>
        <TabsContent value="canciones">
          <Panel>La pestana activa se mantiene visible al cambiar de valor.</Panel>
        </TabsContent>
        <TabsContent value="artistas">
          <Panel>El desplazamiento respeta `prefers-reduced-motion`.</Panel>
        </TabsContent>
        <TabsContent value="albumes">
          <Panel>Fin del ejemplo de overflow.</Panel>
        </TabsContent>
      </Tabs>
    </div>
  )
}
