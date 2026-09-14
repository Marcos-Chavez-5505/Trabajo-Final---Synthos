import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../../services/authService'

function Login() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

    if (!formData.email || !formData.password) {
      setError('Completá todos los campos.')
      return
    }

    const result = loginUser(
      formData.email,
      formData.password
    )

    if (!result.success) {
      setError(result.message)
      return
    }

    navigate('/app')
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h1 className="text-2xl font-semibold mb-2">
            Iniciar sesión
          </h1>

          <p className="text-gray-400 mb-6">
            Ingresá a tu cuenta.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {error && (
              <p className="text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 py-2.5 font-medium transition"
            >
              Iniciar sesión
            </button>
          </form>

          <p className="text-sm text-gray-400 text-center mt-6">
            ¿No tenés una cuenta?{' '}
            <Link
              to="/register"
              className="text-purple-400 hover:text-purple-300"
            >
              Registrarse
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

export default Login