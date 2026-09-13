import './Landing.css'

const Icons = {
  logo: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
    </svg>
  ),
  vote: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  music: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  next: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  ),
  prev: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
    </svg>
  ),
  playFill: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
}

const features = [
  {
    icon: 'users',
    title: 'Grupos de hasta 10 personas',
    text: 'Creá un grupo privado o público, invitá a tus amigos y armen juntos una lista de reproducción compartida.',
  },
  {
    icon: 'play',
    title: 'Una sala, todos sincronizados',
    text: 'El creador de la sala controla play, pausa y salto. Lo que suena, suena igual para todos al mismo tiempo.',
  },
  {
    icon: 'vote',
    title: 'Votación para saltar',
    text: 'Si una canción no va, cualquier miembro puede proponer saltarla. Con mayoría de votos, salta para todos.',
  },
]

const extras = [
  { icon: 'chat', label: 'Chat en tiempo real' },
  { icon: 'music', label: 'Cola colaborativa' },
  { icon: 'heart', label: 'Favoritos y playlists' },
  { icon: 'search', label: 'Búsqueda por género' },
  { icon: 'user', label: 'Seguir usuarios' },
]

const groups = [
  { name: 'Indie Nights', tag: 'Indie', members: 8, active: true },
  { name: 'Rock Nacional', tag: 'Rock', members: 6, active: true },
  { name: 'Tarde de Jazz', tag: 'Jazz', members: 4, active: false },
]

function Nav() {
  return (
    <header className="nav">
      <div className="nav__inner">
        <a href="/" className="nav__logo">
          <span className="nav__logo-mark">{Icons.logo}</span>
          <span>Synthos</span>
        </a>
        <nav className="nav__links">
          <a href="#features">Funciones</a>
          <a href="#groups">Grupos</a>
        </nav>
        <div className="nav__actions">
          <a href="/login" className="btn btn--ghost">Ingresar</a>
          <a href="/register" className="btn btn--primary">Crear cuenta</a>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero__inner">
        <div className="hero__copy">
          <span className="pill">
            <span className="pill__dot" /> En tiempo real
          </span>
          <h1 className="hero__title">
            La música suena mejor
            <br />
            <span className="hero__title-accent">cuando la escuchás acompañado</span>
          </h1>
          <p className="hero__sub">
            Synthos es una plataforma para escuchar música en sincronía con otras personas.
            Creá grupos, armen una lista entre todos y compartan la misma sesión de escucha.
          </p>
          <div className="hero__cta">
            <a href="/register" className="btn btn--primary btn--lg">Crear cuenta</a>
            <a href="#features" className="btn btn--ghost btn--lg">Ver funciones</a>
          </div>
        </div>
        <div className="hero__visual">
          <PlayerMock />
        </div>
      </div>
    </section>
  )
}

function PlayerMock() {
  return (
    <div className="player">
      <div className="player__frame">
        <div className="player__topbar">
          <span className="player__window-dot" />
          <span className="player__window-dot" />
          <span className="player__window-dot" />
          <span className="player__window-title">Sala: Indie Nights</span>
        </div>

        <div className="player__body">
          <div className="player__top">
            <div className="player__cover">
              <AudioBars />
            </div>
            <div className="player__info">
              <div className="player__room">
                <span className="live-dot" /> En vivo
              </div>
              <div className="player__song">Midnight Waves</div>
              <div className="player__artist">Neon Coast</div>
            </div>
          </div>

          <div className="player__bar">
            <div className="player__bar-fill" />
          </div>
          <div className="player__times">
            <span>1:42</span>
            <span>3:28</span>
          </div>

          <div className="player__controls">
            <button className="ctrl" aria-label="Anterior">{Icons.prev}</button>
            <button className="ctrl ctrl--main" aria-label="Play">{Icons.playFill}</button>
            <button className="ctrl" aria-label="Siguiente">{Icons.next}</button>
          </div>

          <div className="player__vote">
            <div className="player__vote-head">
              <span className="player__vote-label">Votación para saltar</span>
              <span className="player__vote-count">3 / 5</span>
            </div>
            <div className="player__vote-bar">
              <div className="player__vote-fill" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AudioBars() {
  return (
    <div className="bars">
      <span className="bars__bar" />
      <span className="bars__bar" />
      <span className="bars__bar" />
      <span className="bars__bar" />
    </div>
  )
}

function Features() {
  return (
    <section id="features" className="section">
      <div className="section__head">
        <span className="kicker">Funciones</span>
        <h2>Todo lo esencial, sin vueltas</h2>
        <p className="section__sub">
          Tres funciones centrales que hacen que escuchar música en grupo funcione de verdad.
        </p>
      </div>

      <div className="features">
        {features.map((f) => (
          <article key={f.title} className="feature">
            <div className="feature__icon">{Icons[f.icon]}</div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </article>
        ))}
      </div>

      <div className="extras">
        <span className="extras__label">Y además</span>
        <div className="extras__list">
          {extras.map((e) => (
            <span key={e.label} className="chip">
              {Icons[e.icon]}
              {e.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function Groups() {
  return (
    <section id="groups" className="section groups">
      <div className="groups__inner">
        <div className="groups__copy">
          <span className="kicker">Grupos</span>
          <h2>Cada grupo es su propio espacio</h2>
          <p className="section__sub">
            Cada grupo tiene su lista de reproducción colaborativa, su chat y su historial.
            Cuando alguien inicia la sala de escucha, todos los miembros conectados escuchan
            lo mismo, al mismo tiempo.
          </p>
          <p className="section__sub">
            Podés seguir a otros usuarios y ver sus perfiles. Los comentarios en un perfil
            están reservados para quienes siguen a esa persona.
          </p>
        </div>

        <div className="groups__panel">
          <div className="groups__panel-head">
            <span>Tus grupos</span>
            <span className="groups__count">3</span>
          </div>
          {groups.map((g) => (
            <div key={g.name} className="group">
              <div className="group__left">
                <span className={`group__dot ${g.active ? 'group__dot--on' : ''}`} />
                <div>
                  <div className="group__name">{g.name}</div>
                  <div className="group__meta">
                    <span className="group__tag">{g.tag}</span>
                    <span>{g.members} miembros</span>
                  </div>
                </div>
              </div>
              <span className={`group__status ${g.active ? 'group__status--on' : ''}`}>
                {g.active ? 'En sala' : 'Inactivo'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="cta">
      <div className="cta__inner">
        <h2>Empezá a escuchar en grupo</h2>
        <p>Creá tu cuenta y armá tu primer grupo en menos de un minuto.</p>
        <div className="cta__buttons">
          <a href="/register" className="btn btn--primary btn--lg">Crear cuenta</a>
          <a href="/login" className="btn btn--ghost btn--lg">Ya tengo cuenta</a>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="nav__logo-mark">{Icons.logo}</span>
          <span>Synthos</span>
        </div>
        <div className="footer__links">
          <a href="#features">Funciones</a>
          <a href="#groups">Grupos</a>
          <a href="/login">Ingresar</a>
          <a href="/register">Crear cuenta</a>
        </div>
        <div className="footer__copy">&copy; {new Date().getFullYear()} Synthos</div>
      </div>
    </footer>
  )
}

export default function Landing() {
  return (
    <div className="landing">
      <Nav />
      <Hero />
      <Features />
      <Groups />
      <FinalCTA />
      <Footer />
    </div>
  )
}