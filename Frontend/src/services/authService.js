const USERS_KEY = 'users'
const SESSION_KEY = 'session'

// ESTO LUEGO SE CAMBIA CON LA BASE DE DATOS

const getUsers = () => {
  const users = localStorage.getItem(USERS_KEY)

  return users ? JSON.parse(users) : []
}

export const registerUser = (userData) => {
  const users = getUsers()

  const existingUser = users.find(
    (user) => user.email.toLowerCase() === userData.email.toLowerCase()
  )

  if (existingUser) {
    return {
      success: false,
      message: 'El email ya está registrado.'
    }
  }

  const newUser = {
    id: crypto.randomUUID(),
    name: userData.name,
    email: userData.email,
    password: userData.password
  }

  users.push(newUser)

  localStorage.setItem(USERS_KEY, JSON.stringify(users))

  return {
    success: true,
    user: newUser
  }
}

export const loginUser = (email, password) => {
  const users = getUsers()

  const user = users.find(
    (user) =>
      user.email.toLowerCase() === email.toLowerCase() &&
      user.password === password
  )

  if (!user) {
    return {
      success: false,
      message: 'Email o contraseña incorrectos.'
    }
  }

  const session = {
    id: user.id,
    name: user.name,
    email: user.email
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(session))

  return {
    success: true,
    user: session
  }
}

export const getCurrentUser = () => {
  const session = localStorage.getItem(SESSION_KEY)

  return session ? JSON.parse(session) : null
}

export const logoutUser = () => {
  localStorage.removeItem(SESSION_KEY)
}

export const isAuthenticated = () => {
  return getCurrentUser() !== null
}