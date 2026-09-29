// Catálogo semilla de canciones mock. Lo consume solo songsService.
// `audioUrl` apunta a archivos de prueba públicos (MP3) para reproducir audio real.
// `coverUrl` en null hasta que exista el backend de imágenes.
//
// `source` es la línea "Reproduciéndose desde" del reproductor. En el mock se
// asigna al azar por canción; cuando exista backend vendrá en el payload real.
const SOURCES = [
  'Tu biblioteca',
  'Coexist',
  'Afterglow',
  'Northbound',
  'Slow Motion',
  'Salas',
]

const randomSource = () => SOURCES[Math.floor(Math.random() * SOURCES.length)]

export const mockSongs = [
  {
    id: 's1',
    title: 'Midnight Waves',
    artist: 'Neon Coast',
    album: 'Afterglow',
    duration: 372,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverUrl: null,
    source: randomSource(),
  },
  {
    id: 's2',
    title: 'Paper Lanterns',
    artist: 'Velvet Hours',
    album: 'Slow Motion',
    duration: 405,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverUrl: null,
    source: randomSource(),
  },
  {
    id: 's3',
    title: 'Concrete Roses',
    artist: 'The Long Way',
    album: 'Northbound',
    duration: 338,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    coverUrl: null,
    source: randomSource(),
  },
  {
    id: 's4',
    title: 'Static Bloom',
    artist: 'Neon Coast',
    album: 'Afterglow',
    duration: 291,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    coverUrl: null,
    source: randomSource(),
  },
  {
    id: 's5',
    title: 'Low Tide',
    artist: 'Salt & Signal',
    album: 'Drift',
    duration: 356,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    coverUrl: null,
    source: randomSource(),
  },
  {
    id: 's6',
    title: 'Glass Elevator',
    artist: 'Marina Error',
    album: 'Upside Down',
    duration: 324,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    coverUrl: null,
    source: randomSource(),
  },
  {
    id: 's7',
    title: 'Fever Dream',
    artist: 'Velvet Hours',
    album: 'Slow Motion',
    duration: 419,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    coverUrl: null,
    source: randomSource(),
  },
  {
    id: 's8',
    title: 'Last Train Home',
    artist: 'The Long Way',
    album: 'Northbound',
    duration: 387,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    coverUrl: null,
    source: randomSource(),
  },
]
