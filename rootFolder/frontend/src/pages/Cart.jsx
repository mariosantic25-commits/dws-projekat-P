import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useForm } from '../hooks/useForm.js'
import { api } from '../api/index.js'
import { required, minLength } from '../utils/validators.js'
import Spinner from '../components/common/Spinner.jsx'

// Pravila validacije za formu za dostavu (Ispunjavanje zahtjeva specifikacije)
const RULES = {
  fullName: [required('Ime i prezime je obavezno.')],
  address:  [required('Adresa za dostavu je obavezna.')],
  city:     [required('Grad je obavezan.')],
  phone:    [required('Broj telefona je obavezan.'), minLength(6, 'Broj telefona mora imati najmanje 6 cifara.')],
  payment:  [required('Odaberite način plaćanja.')]
}

export default function Cart() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, total, loading, removeItem, clearCart } = useCart()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  // Inicijalizacija useForm custom hooka sa podacima ulogovanog korisnika ako postoje
  const { values, errors, touched, handleChange, handleBlur, handleSubmit } = useForm(
    {
      fullName: user ? `${user.firstName} ${user.lastName}` : '',
      address: '',
      city: user ? user.location : '',
      phone: '',
      payment: 'pouzecem'
    },
    RULES
  )

  // Slanje i obrada narudžbe
  const handleCheckout = async (formValues) => {
    if (items.length === 0) {
      showToast('⚠️', 'Vaša korpa je prazna.')
      return
    }

    setSubmitting(true)
    try {
      // 1. Kreiranje objekta narudžbe za bazu podataka
      const orderData = {
        userId: user.id,
        customerName: formValues.fullName,
        deliveryAddress: formValues.address,
        deliveryCity: formValues.city,
        phone: formValues.phone,
        paymentMethod: formValues.payment,
        items: items.map(i => ({
          cartItemId: i.id,
          productId: i.productId,
          title: i.product?.title,
          price: i.product?.price,
          emoji: i.product?.emoji
        })),
        totalPrice: total,
        status: 'na_cekanju',
        created_at: new Date().toISOString()
      }

      // Slanje na json-server /orders
      await api.post('/orders', orderData)

      // 2. Pražnjenje korpe preko CartContext-a
      await clearCart()

      showToast('🎉', 'Narudžba uspješno poslana! Prodavači će vas kontaktirati.')
      navigate('/')
    } catch (err) {
      showToast('❌', 'Došlo je do greške prilikom obrade narudžbe.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner text="Učitavanje vaše korpe..." />

  // Prikaz ako je korpa prazna (Uljepšan i centriran Empty State)
  if (items.length === 0) {
    return (
      <div className="main-layout" style={{ display: 'flex', justifyContent: 'center', padding: '60px 24px' }}>
        <div className="card" style={{ 
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          padding: '50px 40px', 
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ 
            fontSize: 48, 
            marginBottom: 20,
            width: '90px',
            height: '90px',
            background: 'var(--orange-light)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            🛒
          </div>
          <h2 style={{ fontFamily: 'Fraunces', fontSize: 24, marginBottom: 10, color: 'var(--text)' }}>
            Vaša korpa je prazna
          </h2>
          <p style={{ color: 'var(--text-3)', marginBottom: 26, fontSize: 14, maxWidth: '360px', lineHeight: '1.5' }}>
            Nemate dodanih artikala u korpu. Pregledajte ponudu i pronađite nešto za sebe!
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ padding: '10px 28px', fontWeight: 500 }}>
            Pretraži artikle
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="main-layout">
      <h1 style={{ fontFamily: 'Fraunces', fontSize: 28, marginBottom: 24 }}>Vaša korpa</h1>
      
      {/* Iskorštavanje definisane dvo-kolonske .cart-layout strukture iz globals.css */}
      <div className="cart-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        
        {/* LIJEVA STRANA: Lista artikala i Forma za dostavu */}
        <div className="cart-left" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* LISTA ARTIKALA */}
          <div className="pdetail-card" style={{ padding: 20 }}>
            <h3 style={{ fontFamily: 'Fraunces', marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
              Artikli za kupovinu ({items.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map(item => (
                <div key={item.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border-light)'
                }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-subtle)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0
                  }}>
                    {item.product?.emoji || '📦'}
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <h4 
                      style={{ fontSize: 15, fontWeight: 500, marginBottom: 4, cursor: 'pointer' }} 
                      onClick={() => navigate(`/product/${item.productId}`)}
                    >
                      {item.product?.title || 'Artikal'}
                    </h4>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      Prodavač: @{item.product?.seller || 'korisnik'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--green)', fontSize: 16, marginBottom: 4 }}>
                      {item.product?.price || 0} KM
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--red)',
                        fontSize: 12, cursor: 'pointer', padding: 0, textDecoration: 'underline'
                      }}
                    >
                      Ukloni
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FORMA ZA DOSTAVU */}
          <div className="pdetail-card" style={{ padding: 20 }}>
            <h3 style={{ fontFamily: 'Fraunces', marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Podaci za dostavu</h3>
            <form onSubmit={handleSubmit(handleCheckout)}>
              
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Ime i prezime</label>
                  <input
                    type="text"
                    name="fullName"
                    className={`form-input ${errors.fullName && touched.fullName ? 'error' : ''}`}
                    value={values.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Npr. Mujo Mujićić"
                  />
                  {errors.fullName && touched.fullName && <div className="form-error">⚠ {errors.fullName}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Broj telefona</label>
                  <input
                    type="text"
                    name="phone"
                    className={`form-input ${errors.phone && touched.phone ? 'error' : ''}`}
                    value={values.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Npr. 061 123 456"
                  />
                  {errors.phone && touched.phone && <div className="form-error">⚠ {errors.phone}</div>}
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label">Adresa stanovanja</label>
                  <input
                    type="text"
                    name="address"
                    className={`form-input ${errors.address && touched.address ? 'error' : ''}`}
                    value={values.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Npr. Maršala Tita 45"
                  />
                  {errors.address && touched.address && <div className="form-error">⚠ {errors.address}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Grad</label>
                  <input
                    type="text"
                    name="city"
                    className={`form-input ${errors.city && touched.city ? 'error' : ''}`}
                    value={values.city}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Sarajevo"
                  />
                  {errors.city && touched.city && <div className="form-error">⚠ {errors.city}</div>}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 4 }}>
                <label className="form-label">Način plaćanja</label>
                <select
                  name="payment"
                  className="form-select"
                  value={values.payment}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <option value="pouzecem">💵 Pouzećem (Gotovina pri preuzimanju)</option>
                  <option value="kartica" disabled>💳 Kreditna kartica (Uskoro dostupno)</option>
                </select>
              </div>
              
              {/* Skriveni button koji služi da pokrenemo submit forme iz spoljne kartice na desnoj strani */}
              <button type="submit" id="hidden-checkout-submit-btn" style={{ display: 'none' }} />
            </form>
          </div>
        </div>

        {/* DESNA STRANA: Pregled cijene i završi narudžbu (.order-summary iz globals.css) */}
        <div className="order-summary">
          <div className="pdetail-meta-card" style={{ position: 'sticky', top: 'calc(var(--nav-h) + 20px)' }}>
            <h3 style={{ fontFamily: 'Fraunces', marginBottom: 16, fontSize: 18 }}>Pregled narudžbe</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-2)' }}>
                <span>Ukupno stavki:</span>
                <span>{items.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-2)' }}>
                <span>Dostava:</span>
                <span style={{ color: 'var(--green)', fontWeight: 500 }}>BESPLATNA</span>
              </div>
              <hr className="divider" style={{ margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700 }}>
                <span>Ukupan iznos:</span>
                <span style={{ color: 'var(--green)' }}>{total} KM</span>
              </div>
            </div>

            {/* Klikom na ovaj gumb simulira se klik na skriveni submit unutar forme kako bi se pokrenula HTML5 i useForm validacija */}
            <button 
              className="btn btn-primary btn-full"
              disabled={submitting}
              onClick={() => document.getElementById('hidden-checkout-submit-btn').click()}
            >
              {submitting ? 'Obrada narudžbe...' : '🚀 Završi narudžbu'}
            </button>

            <button 
              className="btn btn-ghost btn-full" 
              style={{ marginTop: 8 }}
              onClick={() => navigate('/')}
              disabled={submitting}
            >
              ← Nastavi kupovinu
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}