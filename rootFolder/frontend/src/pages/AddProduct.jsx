import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { api } from '../api/index.js'

const CATEGORIES = [
  { value: 'odjeca', label: 'Odjeća' },
  { value: 'obuca', label: 'Obuća' },
  { value: 'elektronika', label: 'Elektronika' },
  { value: 'knjige', label: 'Knjige' },
  { value: 'namjestaj', label: 'Namještaj' },
  { value: 'sport', label: 'Sport' },
  { value: 'kuhinja', label: 'Kuhinja' },
  { value: 'igracke', label: 'Igračke' },
  { value: 'ostalo', label: 'Ostalo' }
]
const CITIES = ['Sarajevo', 'Mostar', 'Banja Luka', 'Tuzla', 'Zenica']

export default function AddProduct() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

  // State za formu
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0].value) // ⬅️ Ovdje smo dodali .value
  const [condition, setCondition] = useState('novo_s_etiketom')
  const [city, setCity] = useState(user?.location || CITIES[0])
  const [emoji, setEmoji] = useState('📦')
  const [image, setImage] = useState('')
  const [desc, setDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Ako korisnik nije prijavljen, preusmjeri ga na login
  useEffect(() => {
    if (!user) {
      showToast('⚠️', 'Morate biti prijavljeni da biste dodali oglas.')
      navigate('/login')
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title.trim() || !price || !desc.trim()) {
      showToast('⚠️', 'Molimo popunite sva obavezna polja.')
      return
    }

    setSubmitting(true)

    try {
      // ⬅️ Prilagodili smo polja tačno onako kako db.json traži!
      const newProduct = {
        userId: user.id, 
        sellerId: user.id,           // Potrebno za chat
        title: title.trim(),
        price: Number(price),
        category: category,
        condition_lvl: condition,    // db.json koristi condition_lvl
        location: city,              // db.json koristi location
        status: "active",            // mora da bi se prikazalo na početnoj lol
        emoji: emoji || '📦',
        image: image.trim() || null, 
        description: desc.trim(),    // db.json koristi description
        view_count: 0,
        avg_rating: 0,
        created_at: new Date().toISOString()
      }

      // Slanje u json-server bazu
      const createdProduct = await api.post('/products', newProduct)
      
      showToast('✅', 'Oglas je uspješno objavljen!')
      // Preusmjeravanje direktno na detalje tog novog artikla
      navigate(`/product/${createdProduct.id}`)
    } catch (err) {
      console.error(err)
      showToast('❌', 'Došlo je do greške pri objavi oglasa.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div style={{ maxWidth: '650px', margin: '40px auto', padding: '0 20px' }}>
      <div className="card" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
        
        <h2 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--text)' }}>
          Novi oglas
        </h2>
        <p style={{ color: 'var(--text-3)', fontSize: '14px', margin: '0 0 28px 0' }}>
          Unesite detalje o artiklu koji želite prodati na Thriftly platformi.
        </p>

        <form onSubmit={handleSubmit}>
          
          {/* Naziv artikla */}
          <div className="form-group">
            <label className="form-label">Naziv artikla *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="npr. Vintage Kožna Jakna" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Cijena */}
            <div className="form-group">
              <label className="form-label">Cijena (KM) *</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="0.00"
                min="1"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
              />
            </div>

            {/* Grad / Lokacija */}
            <div className="form-group">
              <label className="form-label">Grad / Lokacija</label>
              <select className="form-select" value={city} onChange={e => setCity(e.target.value)}>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Kategorija */}
            <div className="form-group">
              <label className="form-label">Kategorija</label>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                {/* ⬅️ Ovdje smo mapirali .value i .label */}
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Stanje artikla */}
            <div className="form-group">
              <label className="form-label">Stanje artikla</label>
              <select className="form-select" value={condition} onChange={e => setCondition(e.target.value)}>
                <option value="novo_s_etiketom">Novo s etiketom</option>
                <option value="kao_novo">Kao novo</option>
                <option value="dobro">Dobro</option>
                <option value="prihvatljivo">Prihvatljivo</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '16px' }}>
            {/* Emoji / Simbol */}
            <div className="form-group">
              <label className="form-label">Emoji ikona</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="📦" 
                maxLength="2"
                value={emoji}
                onChange={e => setEmoji(e.target.value)}
                style={{ textAlign: 'center', fontSize: '18px' }}
              />
            </div>

            {/* URL slike */}
            <div className="form-group">
              <label className="form-label">Link (URL) slike</label>
              <input 
                type="url" 
                className="form-input" 
                placeholder="https://example.com/slika.jpg (opcionalno)" 
                value={image}
                onChange={e => setImage(e.target.value)}
              />
            </div>
          </div>

          {/* Opis artikla */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Opis artikla *</label>
            <textarea 
              className="form-textarea" 
              placeholder="Unesite detalje o veličini, očuvanosti, brendu i slično..."
              rows={5}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              required
            />
          </div>

          {/* Dugmad */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => navigate('/')}
              disabled={submitting}
            >
              Otkaži
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={submitting}
              style={{ padding: '0 32px' }}
            >
              {submitting ? 'Objavljivanje...' : 'Objavi oglas'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}