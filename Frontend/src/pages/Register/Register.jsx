import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../../services/authService'

function Register() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    setError('')

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError('Completá todos los campos.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    const result = registerUser({
      name: formData.name,
      email: formData.email,
      password: formData.password
    })

    if (!result.success) {
      setError(result.message)
      return
    }

    navigate('/login')
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h1 className="text-2xl font-semibold mb-2">
            Crear cuenta
          </h1>

          <p className="text-gray-400 mb-6">
            Registrate para comenzar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2">
                Nombre
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 outline-none focus:border-purple-500"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 outline-none focus:border-purple-500"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">
                Contraseña
              </label>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 outline-none focus:border-purple-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">
                Confirmar contraseña
              </label>

              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 outline-none focus:border-purple-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 py-2.5 font-medium transition"
            >
              Registrarse
            </button>
          </form>

          <p className="text-sm text-gray-400 text-center mt-6">
            ¿Ya tenés una cuenta?{' '}
            <Link
              to="/login"
              className="text-purple-400 hover:text-purple-300"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default Register