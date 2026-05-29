import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useForm } from '../hooks/useForm.js'
import { required, validEmail } from '../utils/validators.js'

const RULES = {
  email:    [required(), validEmail()],
  password: [required()],
}

export default function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login } = useAuth()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const { values, errors, touched, handleChange, handleBlur, handleSubmit } = useForm(
    { email: '', password: '' },
    RULES
  )

  const from = location.state?.from?.pathname || '/'

  const onSubmit = async (vals) => {
    setSubmitting(true)
    setServerError('')
    try {
      const user = await login(vals.email, vals.password)
      showToast('👋', `Dobrodošli nazad, ${user.firstName}!`)
      navigate(from, { replace: true })
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Thrift<span>ly</span></div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
            Dobrodošli nazad
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-2)' }}>
            Prijavite se na vaš Thriftly račun
          </div>
        </div>

        {serverError && (
          <div style={{
            background: 'var(--red-light)', color: 'var(--red)',
            border: '1px solid var(--red-light)',
            borderRadius: 'var(--radius-md)', padding: '10px 14px',
            fontSize: 13, marginBottom: 16,
          }}>
            ⚠ {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label">Email adresa</label>
            <input
              className={`form-input ${errors.email && touched.email ? 'error' : ''}`}
              type="email" name="email" placeholder="vasa@email.com"
              value={values.email}
              onChange={handleChange} onBlur={handleBlur}
              autoComplete="email"
            />
            {errors.email && touched.email && (
              <div className="form-error">⚠ {errors.email}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Lozinka</label>
            <input
              className={`form-input ${errors.password && touched.password ? 'error' : ''}`}
              type="password" name="password" placeholder="••••••••"
              value={values.password}
              onChange={handleChange} onBlur={handleBlur}
              autoComplete="current-password"
            />
            {errors.password && touched.password && (
              <div className="form-error">⚠ {errors.password}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ marginTop: 4 }}
            disabled={submitting}
          >
            {submitting ? 'Prijava...' : 'Prijava'}
          </button>
        </form>

        <div className="auth-switch">
          Nemate račun? <Link to="/register">Registrujte se</Link>
        </div>
      </div>
    </div>
  )
}