import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import { Button } from '../../components/ui/button.tsx'
import { Input } from '../../components/ui/input.tsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')

    if (!formData.email || !formData.password) {
      setError('Completá todos los campos.')
      return
    }

    setSubmitting(true)

    const result = await login(formData.email, formData.password)

    setSubmitting(false)

    if (!result.success) {
      setError(result.message)
      return
    }

    navigate('/home', { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 Wall">
      <section className="w-full max-w-md rounded-xl p-8 SurfaceLight Elevation1">
        <h1 className="Header3">Iniciar sesión</h1>
        <p className="mt-1 TextMedium opacity-70">Ingresá a tu cuenta de Synthos.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="TextMedium opacity-80">Email</span>
            <Input
              className="mt-1 TextRegluar"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
            />
          </label>

          <label className="block">
            <span className="TextMedium opacity-80">Contraseña</span>
            <Input
              className="mt-1 TextRegluar"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </label>

          {error && <p className="rounded px-3 py-2 TextMedium Red">{error}</p>}

          <Button
            type="submit"
            disabled={submitting}
            className="h-10 w-full Button"
          >
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>

        <p className="mt-6 text-center TextMedium opacity-70">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="underline">
            Creá una
          </Link>
        </p>
      </section>
    </main>
  )
}