// Semilla de usuarios mock. El agente debe usar/ampliar esto en TS-03/TS-05.
// No representa datos reales ni persistentes.
export const mockUsers = [
  {
    id: 'u1',
    email: 'demo@example.com',
    username: 'demo',
    password: 'Demo1234', // TODO(agente): nunca comparar en texto plano en un backend real
    avatarUrl: null,
    bio: '',
  },
]
