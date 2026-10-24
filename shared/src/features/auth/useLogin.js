import { useState } from 'react'
import useAuth from '../../hooks/useAuth.js'

/**
 * Estado y handlers del formulario de login.
 */
export default function useLogin() {
  const { login } = useAuth()

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
      return { success: false }
    }

    setSubmitting(true)

    const result = await login(formData.email, formData.password)

    setSubmitting(false)

    if (!result.success) {
      setError(result.message)
      return result
    }

    return result
  }

  return { formData, error, submitting, handleChange, handleSubmit }
}