import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
// DODANO: api import
import { api, productsApi, reviewsApi, conversationsApi } from '../api/index.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Spinner from '../components/common/Spinner.jsx'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addItem } = useCart()
  const { showToast } = useToast()

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const prodData = await productsApi.getById(`${id}?_expand=user`)
        setProduct(prodData)

        const revData = await reviewsApi.getProductReviews(id)
        setReviews(revData)
      } catch (err) {
        setError('Proizvod nije pronađen ili je došlo do greške.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  useEffect(() => {
    setImgError(false)
  }, [id])

  const handleAddToCart = async () => {
    if (!user) {
      showToast('⚠️', 'Morate biti prijavljeni da biste dodali u korpu.')
      navigate('/login')
      return
    }
    
    if (product.userId === user.id) {
      showToast('❌', 'Ne možete kupiti vlastiti proizvod!')
      return
    }

    const res = await addItem(product)
    if (res === 'duplicate') {
      showToast('ℹ️', 'Proizvod je već u vašoj korpi.')
    } else if (res) {
      showToast('🛒', 'Proizvod uspješno dodan u korpu!')
    }
  }

  // ISPRAVLJENA FUNKCIJA ZA KONTAKT
  const handleContactSeller = async () => {
    if (!user) {
      showToast('⚠️', 'Morate biti prijavljeni da biste poslali poruku.');
      return;
    }
    
    // Ispravke neke lol
    const sellerId = product.sellerId || product.user?.id || product.userId;
    
    if (String(user.id) === String(sellerId)) {
      showToast('⚠️', 'Ne možete kontaktirati sami sebe.');
      return;
    }

    try {
      // api.get 
      const allConvos = await api.get('/conversations'); 
      const existingConvo = allConvos.find(c => 
        String(c.productId) === String(product.id) &&
        (String(c.buyerId) === String(user.id) || String(c.sellerId) === String(user.id) || 
         String(c.participant_one) === String(user.id))
      );

      if (existingConvo) {
        navigate(`/chat/${existingConvo.id}`);
      } else {
        const newConvo = await api.post('/conversations', {
          productId: product.id,
          buyerId: user.id,
          sellerId: sellerId,
          created_at: new Date().toISOString(),
          last_message_at: new Date().toISOString()
        });
        navigate(`/chat/${newConvo.id}`);
      }
    } catch (error) {
      console.error("Greška pri kreiranju konverzacije:", error);
      showToast('❌', 'Došlo je do greške pri otvaranju chata.');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      showToast('⚠️', 'Morate biti prijavljeni da biste ostavili recenziju.')
      return
    }

    if (!comment.trim()) {
      showToast('⚠️', 'Molimo unesite komentar.')
      return
    }

    setSubmittingReview(true)
    try {
      const newReview = {
        productId: Number(id),
        reviewerId: user.id,
        reviewerName: `${user.firstName} ${user.lastName}`,
        rating: Number(rating),
        comment: comment.trim(),
        created_at: new Date().toISOString()
      }

      const created = await reviewsApi.addProductReview(newReview)
      setReviews(prev => [...prev, created])
      setComment('')
      setRating(5)
      showToast('✅', 'Recenzija uspješno objavljena!')
    } catch (err) {
      showToast('❌', 'Greška pri slanju recenzije.')
    } finally {
      setSubmittingReview(false)
    }
  }
  // klasicni html u nastavku, no comment
  if (loading) return <Spinner text="Učitavanje detalja o proizvodu..." />
  if (error || !product) return <div className="error-wrap">⚠ {error || 'Proizvod nije pronađen.'}</div>

  const conditionLabels = {
    novo_s_etiketom: 'Novo s etiketom',
    kao_novo: 'Kao novo',
    dobro: 'Dobro',
    prihvatljivo: 'Prihvatljivo',
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      
      <div className="pdetail-layout">
        
        <div>
          <div className="pdetail-img-placeholder" style={product.image && !imgError ? { overflow: 'hidden', padding: 0 } : {}}>
            {product.image && !imgError ? (
              <img 
                src={product.image} 
                alt={product.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                onError={() => setImgError(true)} 
              />
            ) : (
              <span>{product.emoji || '📦'}</span>
            )}
          </div>
          
          <div className="detail-section" style={{ marginTop: '32px' }}>
            <h3 className="detail-section-title">Opis</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {product.desc || 'Prodavač nije unio detaljan opis za ovaj proizvod.'}
            </p>
          </div>

          <div className="divider" />

          <div className="detail-section">
            <h3 className="detail-section-title">Recenzije</h3>
            
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-3)', fontStyle: 'italic', marginTop: '8px' }}>
                Nema recenzija za ovaj proizvod. Budite prvi koji će ostaviti utisak!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                {reviews.map(r => (
                  <div key={r.id} className="review-card">
                    <div className="review-header">
                      <div className="review-avatar">
                        {r.reviewerName ? r.reviewerName.split(' ').map(n => n[0]).join('') : 'U'}
                      </div>
                      <div style={{ flexGrow: 1 }}>
                        <div className="review-name">{r.reviewerName || 'Anonimni korisnik'}</div>
                        <div className="stars">
                          {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                        </div>
                      </div>
                      <div className="review-date">
                        {new Date(r.created_at).toLocaleDateString('bs-BA')}
                      </div>
                    </div>
                    <p className="review-text">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="card" style={{ padding: '24px', marginTop: '32px' }}>
              <h4 className="detail-section-title" style={{ marginBottom: '16px' }}>Ostavite recenziju</h4>
              <form onSubmit={handleReviewSubmit}>
                <div className="form-group">
                  <label className="form-label">Ocjena</label>
                  <select 
                    className="form-select"
                    value={rating} 
                    onChange={e => setRating(e.target.value)}
                    style={{ maxWidth: '200px' }}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                    <option value={4}>⭐⭐⭐⭐ (4)</option>
                    <option value={3}>⭐⭐⭐ (3)</option>
                    <option value={2}>⭐⭐ (2)</option>
                    <option value={1}>⭐ (1)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Komentar</label>
                  <textarea 
                    className="form-textarea"
                    placeholder="Kakvo je vaše mišljenje o ovom artiklu ili prodavaču..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={4}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Slanje...' : 'Objavi recenziju'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="pdetail-right">
          
          <h1 className="pdetail-title">
            {product.title}
          </h1>

          <div className="pdetail-price">
            {product.price} KM
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <span className="tag tag-brown">{conditionLabels[product.condition] || product.condition}</span>
            <span className="tag tag-denim">{product.city || 'Sarajevo'}</span>
            <span className="tag tag-green">Kat: {product.category}</span>
          </div>

          <div className="seller-card">
            <div className="seller-avatar">
              {product.user?.firstName ? product.user.firstName[0] + product.user.lastName[0] : '??'}
            </div>
            <div style={{ flex: 1 }}>
              <div className="seller-name">
                {product.user ? `${product.user.firstName} ${product.user.lastName}` : product.sellerFull || 'Korisnik'}
              </div>
              <div className="seller-stats">
                ⭐ {product.user?.avg_rating || '4.7'} · {product.user?.reviews_count || '8'} recenzija · {product.city || 'Sarajevo'}
              </div>
            </div>
            <button 
              className="btn btn-ghost btn-sm" 
              style={{ color: 'var(--green)', fontWeight: '600', padding: '4px 8px' }}
              onClick={handleContactSeller}
            >
              Poruka
            </button>
          </div>

          <div className="detail-section" style={{ marginTop: '24px' }}>
            <h3 className="detail-section-title">Detalji</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="detail-row">
                <span className="dk">Stanje</span>
                <span className="dv">{conditionLabels[product.condition] || product.condition}</span>
              </div>
              <div className="detail-row">
                <span className="dk">Kategorija</span>
                <span className="dv">{product.category}</span>
              </div>
              <div className="detail-row">
                <span className="dk">Lokacija</span>
                <span className="dv">{product.city || 'Sarajevo'}</span>
              </div>
              <div className="detail-row">
                <span className="dk">Ocjena prodavača</span>
                <span className="dv">⭐ {product.user?.avg_rating || '4.7'}</span>
              </div>
              <div className="detail-row">
                <span className="dk">Broj recenzija</span>
                <span className="dv">{product.user?.reviews_count || '8'}</span>
              </div>
            </div>
          </div>

          <div className="pdetail-actions" style={{ marginTop: '28px' }}>
            <button className="btn btn-primary" style={{ flex: 1, padding: '12px' }} onClick={handleAddToCart}>
              🛒 Dodaj u korpu
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, padding: '12px' }} onClick={handleContactSeller}>
              💬 Kontaktiraj
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}