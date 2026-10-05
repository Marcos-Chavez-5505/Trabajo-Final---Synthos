import { Link } from 'react-router-dom'

// TODO(agente): decidir dónde se monta esta ruta en AppRoutes.jsx.
// Sugerido: pública en "/", redirigiendo a Home si ya hay sesión (una vez
// exista el RequireAuth/guard de rutas). No wireo la ruta acá para no pisar
// la lógica de auth que todavía está pendiente.

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Armá tu playlist',
    text: 'Subí o elegí las canciones que querés compartir.',
  },
  {
    step: '2',
    title: 'Abrí una sala',
    text: 'Invitá a quien quieras, pública o con contraseña.',
  },
  {
    step: '3',
    title: 'Escuchen juntos',
    text: 'Todos ven la misma canción, en el mismo momento.',
  },
]

const FEATURES = [
  {
    title: 'Seguí a tu gente',
    text: 'Encontrá personas con tu mismo gusto musical y segui su actividad.',
  },
  {
    title: 'Dejá recomendaciones',
    text: 'Compartile una canción a quien sigas, con unas palabras.',
  },
  {
    title: 'Votá qué suena',
    text: 'En cada sala, la mayoría puede saltar la canción actual.',
  },
]

export default function Landing() {
  return (
    <div className="Surface min-h-screen text-white">
      {/* Nav mínima */}
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        {/* TODO: reemplazar por el nombre real de la app */}
        <span className="TextLarge text-white">App</span>
        <nav className="flex items-center gap-4">
          <Link to="/login" className="TextRegluar text-neutral-300">
            Ya tengo cuenta
          </Link>
          <Link
            to="/register"
            className="Fucsia TextRegluar rounded-full px-4 py-2 text-white"
          >
            Crear cuenta
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="grid items-center gap-10 px-6 pb-16 pt-10 md:grid-cols-2 md:px-12 md:pb-24 md:pt-16">
        <div className="max-w-md">
          <h1 className="Header1 text-white">
            Escuchá música con tu gente, en tiempo real.
          </h1>
          <p className="TextLarge mt-5 text-neutral-300">
            Armá salas de escucha compartida, seguí a quienes tienen tu mismo
            gusto musical y dejales una recomendación.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              to="/register"
              className="Fucsia TextRegluar rounded-full px-6 py-3 text-white"
            >
              Crear cuenta gratis
            </Link>
            <Link
              to="/login"
              className="SurfaceLight TextRegluar rounded-full px-6 py-3 text-white"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>

        {/* Pieza visual: portadas apiladas, el único momento "bold" de la página */}
        <div className="relative mx-auto h-72 w-72 md:h-80 md:w-80">
          <div className="Light absolute left-0 top-10 h-48 w-48 -rotate-6 rounded-lg shadow-2xl md:h-56 md:w-56" />
          <div className="Pink absolute left-16 top-0 h-48 w-48 rotate-3 rounded-lg shadow-2xl md:h-56 md:w-56" />
          <div className="Volume absolute left-8 top-20 flex h-40 w-40 -rotate-2 items-center justify-center rounded-lg shadow-2xl md:h-48 md:w-48">
            <span className="text-5xl">▶</span>
          </div>
        </div>
      </section>

      {/* Cómo funciona — secuencia real, numeración justificada */}
      <section className="Wall px-6 py-16 md:px-12">
        <h2 className="Header3 mb-10 text-white">Cómo funciona</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step}>
              <span className="Header3 text-white">{item.step}</span>
              <h3 className="TextLarge mt-2 text-white">{item.title}</h3>
              <p className="TextRegluar mt-1 text-neutral-300">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features sociales — sin numerar, no es una secuencia */}
      <section className="px-6 py-16 md:px-12">
        <h2 className="Header3 mb-10 text-white">Más que un reproductor</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="SurfaceLight rounded-lg p-6">
              <h3 className="TextLarge text-white">{feature.title}</h3>
              <p className="TextRegluar mt-2 text-neutral-300">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="Volume flex flex-col items-center gap-4 px-6 py-16 text-center md:px-12">
        <h2 className="Header3 text-white">Sumate gratis</h2>
        <p className="TextRegluar max-w-md text-neutral-300">
          Creá tu cuenta y empezá a armar tu primera sala de escucha hoy mismo.
        </p>
        <Link
          to="/register"
          className="Fucsia TextRegluar mt-2 rounded-full px-6 py-3 text-white"
        >
          Crear cuenta
        </Link>
      </section>

      <footer className="px-6 py-8 md:px-12">
        {/* TODO: reemplazar por el nombre real de la app */}
        <p className="TextTiny text-neutral-500">© {new Date().getFullYear()} App</p>
      </footer>
    </div>
  )
}