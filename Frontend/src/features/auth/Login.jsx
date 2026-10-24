import { Link, useNavigate } from 'react-router-dom'
import { useLogin } from '@synthos/shared'
import { Button } from '../../components/ui/button.tsx'
import { Input } from '../../components/ui/input.tsx'

export default function Login() {
  const navigate = useNavigate()
  const { formData, error, submitting, handleChange, handleSubmit } = useLogin()

  const onSubmit = async (e) => {
    const result = await handleSubmit(e)
    if (result?.success) {
      navigate('/home', { replace: true })
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 Wall">
      <section className="w-full max-w-md rounded-xl p-8 SurfaceLight Elevation1">
        <h1 className="Header3">Iniciar sesión</h1>
        <p className="mt-1 TextMedium opacity-70">Ingresá a tu cuenta de Synthos.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
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