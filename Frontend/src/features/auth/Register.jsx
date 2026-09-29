import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import { Button } from '../../components/ui/button.tsx'
import { Input } from '../../components/ui/input.tsx'

const PASSWORD_RULES = {
  minLength: 8,
  label: 'La contraseña necesita al menos 8 caracteres, 1 número y 1 mayúscula.',
}

function validatePassword(password) {
  if (password.length < PASSWORD_RULES.minLength) {
    return PASSWORD_RULES.label
  }

  if (!/\d/.test(password) || !/[A-Z]/.test(password)) {
    return PASSWORD_RULES.label
  }

  return ''
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')

    if (!formData.username || !formData.email || !formData.password) {
      setError('Completá todos los campos.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    const passwordError = validatePassword(formData.password)

    if (passwordError) {
      setError(passwordError)
      return
    }

    setSubmitting(true)

    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
    })

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
        <h1 className="Header3">Crear cuenta</h1>
        <p className="mt-1 TextMedium opacity-70">Registrate para empezar a escuchar.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="TextMedium opacity-80">Nombre de usuario</span>
            <Input
              className="mt-1 TextRegluar"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Tu nombre"
            />
          </label>

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

          <label className="block">
            <span className="TextMedium opacity-80">Confirmar contraseña</span>
            <Input
              className="mt-1 TextRegluar"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
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
            {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="mt-6 text-center TextMedium opacity-70">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="underline">
            Iniciá sesión
          </Link>
        </p>
      </section>
    </main>
  )
}