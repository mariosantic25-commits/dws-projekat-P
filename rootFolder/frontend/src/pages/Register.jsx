import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useForm } from '../hooks/useForm.js'
import { required, validEmail, minLength, matchField, noSpaces } from '../utils/validators.js'

const LOCATIONS = ['Sarajevo','Mostar','Banja Luka','Tuzla','Zenica','Ostalo']

const RULES = {
  firstName: [required()],
  lastName:  [required()],
  username:  [required(), minLength(3), noSpaces()],
  email:     [required(), validEmail()],
  password:  [required(), minLength(8, 'Lozinka mora imati minimum 8 karaktera.')],
  confirm:   [required(), matchField('password', 'Lozinka', 'Lozinke se ne poklapaju.')],
  location:  [required('Odaberite lokaciju.')],
}

export default function Register() {
  const navigate    = useNavigate()
  const { register } = useAuth()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const { values, errors, touched, handleChange, handleBlur, handleSubmit } = useForm(
    { firstName: '', lastName: '', username: '', email: '', password: '', confirm: '', location: '' },
    RULES
  )

  const onSubmit = async (vals) => {
    setSubmitting(true)
    setServerError('')
    try {
      const user = await register(vals)
      showToast('🎉', `Dobrodošli na Thriftly, ${user.firstName}!`)
      navigate('/', { replace: true })
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const field = (name, label, type = 'text', placeholder = '') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className={`form-input ${errors[name] && touched[name] ? 'error' : ''}`}
        type={type} name={name} placeholder={placeholder}
        value={values[name]}
        onChange={handleChange} onBlur={handleBlur}
        autoComplete={type === 'password' ? 'new-password' : name}
      />
      {errors[name] && touched[name] && (
        <div className="form-error">⚠ {errors[name]}</div>
      )}
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Thrift<span>ly</span></div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
            Kreiranje računa
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-2)' }}>
            Pridružite se Thriftly zajednici
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
          <div className="form-row">
            {field('firstName', 'Ime', 'text', 'Amir')}
            {field('lastName', 'Prezime', 'text', 'Kovačević')}
          </div>
          {field('username', 'Korisničko ime', 'text', 'amirk92')}
          {field('email', 'Email adresa', 'email', 'vasa@email.com')}
          {field('password', 'Lozinka', 'password', 'Min. 8 karaktera')}
          {field('confirm', 'Potvrda lozinke', 'password', 'Ponovite lozinku')}

          <div className="form-group">
            <label className="form-label">Lokacija</label>
            <select
              className={`form-select ${errors.location && touched.location ? 'error' : ''}`}
              name="location"
              value={values.location}
              onChange={handleChange} onBlur={handleBlur}
            >
              <option value="">Odaberite grad...</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            {errors.location && touched.location && (
              <div className="form-error">⚠ {errors.location}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ marginTop: 4 }}
            disabled={submitting}
          >
            {submitting ? 'Kreiranje...' : 'Kreiraj račun'}
          </button>
        </form>

        <div className="auth-switch">
          Već imate račun? <Link to="/login">Prijavite se</Link>
        </div>
      </div>
    </div>
  )
}