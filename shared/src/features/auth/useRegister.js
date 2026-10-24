import { useState } from 'react'
import useAuth from '../../hooks/useAuth.js'

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

/**
 * Estado y handlers del formulario de registro.
 */
export default function useRegister() {
  const { register } = useAuth()

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
      return { success: false }
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return { success: false }
    }

    const passwordError = validatePassword(formData.password)

    if (passwordError) {
      setError(passwordError)
      return { success: false }
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
      return result
    }

    return result
  }

  return { formData, error, submitting, handleChange, handleSubmit }
}