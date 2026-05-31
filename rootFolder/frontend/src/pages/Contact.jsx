import { useState } from 'react'
import { useToast } from '../context/ToastContext.jsx'
import { useForm } from '../hooks/useForm.js'
import { required, validEmail } from '../utils/validators.js'

const RULES = {
  name: [required('Unesite vaše ime.')],
  email: [required(), validEmail()],
  message: [required('Unesite poruku.')]
}

export default function Contact() {
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, reset } = useForm(
    { name: '', email: '', message: '' }, 
    RULES
  )

  const onSubmit = () => {
    setSubmitting(true)
    // Simulacija slanja forme
    setTimeout(() => {
      showToast('✅', 'Poruka uspješno poslana!')
      reset()
      setSubmitting(false)
    }, 800)
  }

  return (
    <div className="main-layout contact-layout" style={{ display: 'grid', gap: '40px', maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', gridTemplateColumns: '1fr 1fr' }}>
      
      {/* Lijeva strana: Forma */}
      <div>
        <h1 className="section-title">Kontaktirajte nas</h1>
        <p style={{ color: 'var(--text-2)', marginBottom: '24px' }}>
          Imate pitanje, problem ili prijedlog? Ispunite formu ispod i javit ćemo se u najkraćem roku.
        </p>
        
        <form onSubmit={handleSubmit(onSubmit)} className="review-card" style={{ padding: '24px' }}>
          <div className="form-group">
            <label className="form-label">Ime</label>
            <input 
              className={`form-input ${errors.name && touched.name ? 'error' : ''}`} 
              name="name" 
              value={values.name} 
              onChange={handleChange} 
              onBlur={handleBlur} 
              placeholder="Vaše ime"
            />
            {errors.name && touched.name && <div className="form-error">⚠ {errors.name}</div>}
          </div>
          
          <div className="form-group">
            <label className="form-label">Email adresa</label>
            <input 
              className={`form-input ${errors.email && touched.email ? 'error' : ''}`} 
              type="email" 
              name="email" 
              value={values.email} 
              onChange={handleChange} 
              onBlur={handleBlur} 
              placeholder="vasa@email.com"
            />
            {errors.email && touched.email && <div className="form-error">⚠ {errors.email}</div>}
          </div>
          
          <div className="form-group">
            <label className="form-label">Poruka</label>
            <textarea 
              className={`form-textarea ${errors.message && touched.message ? 'error' : ''}`} 
              name="message" 
              rows="5" 
              value={values.message} 
              onChange={handleChange} 
              onBlur={handleBlur}
              placeholder="Kako vam možemo pomoći?"
            ></textarea>
            {errors.message && touched.message && <div className="form-error">⚠ {errors.message}</div>}
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Slanje...' : 'Pošalji poruku'}
          </button>
        </form>
      </div>

      {/* Desna strana: Google Maps */}
      <div>
        <h2 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Naša lokacija</h2>
        <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-light)', height: '400px' }}>
          <iframe
            title="Lokacija ureda"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2876.3262607147754!2d18.399581815504787!3d43.85625857911467!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4758c8c831191069%3A0x679c1e138a0c20!2sSarajevo!5e0!3m2!1sen!2sba!4v1716833000000!5m2!1sen!2sba"
            width="100%" height="100%" style={{ border: 0 }} 
            allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
      
    </div>
  )
}