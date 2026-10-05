// Semilla de salas mock. La consume solo `roomsService` (regla 6 de AGENTS.md).
//
// Es el espejo de `Backend/prisma/seedRooms.js`: mismos nombres, mismos códigos,
// mismos promedios. Así el seed y el mock cuentan la misma historia y la pantalla
// se puede ver de las dos formas (con y sin base levantada) sin que cambien los
// datos esperados.
//
// Los ids siguen el patrón del resto de los mocks del frontend: string corto
// (`r1`, `r2`) en vez del entero de la base. Es lo que espera la UI, no lo que
// devuelve Postgres; `roomsService.toRoom()` normaliza ambos.
//
// `hostRating` es el promedio de `host_rating.rating` que calcula la vista
// `room_avg_rating`. Va YA promediado, no como lista: es lo que el endpoint
// entrega y lo que la tarjeta muestra.
//
// La escala es 1 a 5, la misma que usa `Backend/prisma/seedRooms.js`. TS-11
// ("calificar positivamente") todavía no define la escala en el plan, así que
// mientras tanto 5 es "excelente anfitrión".

export const mockRooms = [
  {
    id: 'r1',
    code: 'ELECTRO404',
    name: 'Electro 404',
    description: 'Bases y hits de club, sin hablar mucho.',
    hostUsername: 'electro_pura',
    // Promedio 5,00 — la mejor calificada. Va cuarta alfabética, así que los dos
    // criterios de orden dan listas DISTINTAS y se puede comprobar el cambio.
    hostRating: 5,
    ratingsCount: 3,
    isPrivate: false,
    maxCapacity: 20,
    songIds: [43886, 306166],
    status: 'activa',
  },
  {
    id: 'r2',
    code: 'JAZZCALLE',
    name: 'Jazz de la calle',
    description: 'Standards y algo de free, volumen bajo.',
    hostUsername: 'jazz_callejero',
    // Promedio 4,33
    hostRating: 4.33,
    ratingsCount: 3,
    isPrivate: false,
    maxCapacity: 12,
    songIds: [25706],
    status: 'activa',
  },
  {
    id: 'r3',
    code: 'ROCKTOTAL',
    name: 'Rock total',
    description: 'Guitarras y mucho volumen.',
    hostUsername: 'rock_total',
    // Promedio 3,67
    hostRating: 3.67,
    ratingsCount: 3,
    isPrivate: false,
    maxCapacity: 30,
    songIds: [26747, 81740, 43886],
    status: 'activa',
  },
  {
    id: 'r4',
    code: 'AMBIENTET',
    name: 'Ambiente total',
    description: 'Para escuchar sin mirar la pantalla.',
    hostUsername: 'ambiente_total',
    // Promedio 2,33
    hostRating: 2.33,
    ratingsCount: 3,
    isPrivate: false,
    maxCapacity: 8,
    songIds: [306166],
    status: 'activa',
  },
  {
    id: 'r5',
    code: 'POPRADIAN',
    name: 'Pop radiante',
    description: 'La sala que siempre pone la que todos quieren.',
    hostUsername: 'pop_radiante',
    // Sin calificaciones a propósito. `avg_rating` es 0 en la base (por el
    // `COALESCE` de la vista), pero acá va en `null`: la UI tiene que poder
    // distinguir "no tiene" de "tiene 0". Si se mostrara 0, la tarjeta de esta
    // sala y la de una calificada con 0 quedarían idénticas.
    hostRating: null,
    ratingsCount: 0,
    isPrivate: false,
    maxCapacity: 15,
    songIds: [25706, 26747],
    status: 'activa',
  },
]