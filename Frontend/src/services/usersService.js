import { mockUsers } from '../mocks/users.js'

const USERS_KEY = 'synthos_mock_users'

function getStoredUsers() {
  let parsed = null
  try {
    const stored = localStorage.getItem(USERS_KEY)
    parsed = stored ? JSON.parse(stored) : null
  } catch {
    parsed = null
  }
  if (Array.isArray(parsed)) return parsed

  const seeded = mockUsers.slice()
  localStorage.setItem(USERS_KEY, JSON.stringify(seeded))
  return seeded
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function withoutPassword(user) {
  if (!user) return null
  const { password: _password, ...safe } = user
  return safe
}

export function listUsers() {
  return getStoredUsers().map(withoutPassword)
}

export function getUserById(id) {
  return withoutPassword(getStoredUsers().find((u) => u.id === id))
}

export function findUserByEmail(email) {
  return getStoredUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  )
}

export function createUser({ email, username, password }) {
  const users = getStoredUsers()
  const user = {
    id: crypto.randomUUID(),
    email,
    username,
    password,
    avatarUrl: null,
    bio: '',
  }
  users.push(user)
  saveUsers(users)
  return withoutPassword(user)
}

export function updateProfile(id, { username, bio, avatarUrl }) {
  const users = getStoredUsers()
  const index = users.findIndex((u) => u.id === id)
  if (index === -1) {
    throw new Error('Usuario no encontrado.')
  }

  const normalizedUsername = String(username ?? '').trim()
  if (!normalizedUsername) {
    throw new Error('El nombre de usuario no puede estar vacío.')
  }

  users[index] = {
    ...users[index],
    username: normalizedUsername,
    bio: String(bio ?? ''),
    avatarUrl: avatarUrl ?? null,
  }
  saveUsers(users)
  return withoutPassword(users[index])
}