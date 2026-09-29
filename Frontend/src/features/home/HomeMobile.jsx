import useAuth from '../../hooks/useAuth.js'

// TODO(agente, TS-06/TS-07): este es solo el shell para que /home sea navegable.
// Cuando se implemente el contenido (novedades y salas sugeridas) hay que
// reincorporar los scaffolds que hoy quedan fuera del arbol y consumir el
// catalogo via songsService.listSongs():
// import MediaCard from '../../components/cards/MediaCard.jsx'
// import SectionCarousel from '../../components/cards/SectionCarousel.jsx'
export default function HomeMobile() {
  const { user } = useAuth()

  return (
    <div className="p-4">
      <h1 className="Header3">Hola, {user?.username}</h1>
      <p className="mt-2 TextRegluar opacity-70">
        Tu colección y tus salas aparecen acá.
      </p>
    </div>
  )
}
