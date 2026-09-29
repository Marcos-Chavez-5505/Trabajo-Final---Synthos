// Auth mock sobre localStorage. El dueño de los usuarios es `usersService`
// (que a su vez usa `mocks/users.js`); acá solo se maneja la sesión.
// La API es async para que coincida con la forma que tendrá el backend real.
import { createUser, findUserByEmail, getUserById } from './usersService.js'

const SESSION_KEY = 'synthos_mock_session'

function readSessionId() {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    return stored ? JSON.parse(stored).id : null
  } catch {
    return null
  }
}

function writeSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id }))
}

export function getCurrentUser() {
  const id = readSessionId()

  return Promise.resolve(id ? getUserById(id) : null)
}

export function registerUser({ email, username, password }) {
  if (findUserByEmail(email)) {
    return Promise.resolve({
      success: false,
      message: 'El email ya está registrado.',
    })
  }

  const user = createUser({ email, username, password })
  writeSession(user)

  return Promise.resolve({ success: true, user })
}

export function loginUser(email, password) {
  const found = findUserByEmail(email)

  if (!found || found.password !== password) {
    return Promise.resolve({
      success: false,
      message: 'Email o contraseña incorrectos.',
    })
  }

  const user = getUserById(found.id)
  writeSession(user)

  return Promise.resolve({ success: true, user })
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY)

  return Promise.resolve()
}

export function isAuthenticated() {
  return readSessionId() !== null
}
