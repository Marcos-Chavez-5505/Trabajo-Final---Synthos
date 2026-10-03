// Semilla de usuarios mock. El agente debe usar/ampliar esto en TS-03/TS-05.
// No representa datos reales ni persistentes.
//
// TS-08 (búsqueda de personas) necesita más de un usuario para que la paginación
// tenga algo que mostrar: con `SEARCH_PAGE_SIZE = 4` en `usersService`, 10
// usuarios dan 3 páginas. El primero es la cuenta de demo que usan login y
// register.
export const mockUsers = [
  {
    id: 'u1',
    email: 'demo@example.com',
    username: 'demo',
    password: 'Demo1234', // TODO(agente): nunca comparar en texto plano en un backend real
    avatarUrl: null,
    bio: 'Cuenta de demostración.',
  },
  {
    id: 'u2',
    email: 'juan@example.com',
    username: 'Juán Pérez',
    password: 'Demo1234',
    avatarUrl: null,
    bio: 'EcLECTIonica y sintetizadores. Armo playlists para estudiar.',
  },
  {
    id: 'u3',
    email: 'lucia@example.com',
    username: 'lucia.m',
    password: 'Demo1234',
    avatarUrl: null,
    bio: 'Rock nacional y algo de soul.',
  },
  {
    id: 'u4',
    email: 'mar@example.com',
    username: 'Mara Sol',
    password: 'Demo1234',
    avatarUrl: null,
    bio: 'Jazz, café y multilista.',
  },
  {
    id: 'u5',
    email: 'nico@example.com',
    username: 'nico_92',
    password: 'Demo1234',
    avatarUrl: null,
    bio: 'Hip hop y beats para trabajar.',
  },
  {
    id: 'u6',
    email: 'sofia@example.com',
    username: 'Sofía',
    password: 'Demo1234',
    avatarUrl: null,
    bio: 'Reggaetón y pop. Armo las listas para la sala.',
  },
  {
    id: 'u7',
    email: 'beto@example.com',
    username: 'beto',
    password: 'Demo1234',
    avatarUrl: null,
    bio: 'Rock clásico y undiscovered.',
  },
  {
    id: 'u8',
    email: 'valen@example.com',
    username: 'Valen R',
    password: 'Demo1234',
    avatarUrl: null,
    bio: 'Indie y dream pop.',
  },
  {
    id: 'u9',
    email: 'cami@example.com',
    username: 'camik',
    password: 'Demo1234',
    avatarUrl: null,
    bio: 'Bossa nova para las tardes.',
  },
  {
    id: 'u10',
    email: 'tomas@example.com',
    username: 'Tomás',
    password: 'Demo1234',
    avatarUrl: null,
    bio: 'Techno y ambient.',
  },
]
