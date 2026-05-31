import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, productsApi, reviewsApi } from '../api/index.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Spinner from '../components/common/Spinner.jsx'

export default function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser, refreshUser } = useAuth()
  const { showToast } = useToast()

  // Određivanje da li gledamo vlastiti profil
  const isOwnProfile = !id || parseInt(id) === currentUser?.id
  const profileUserId = isOwnProfile ? currentUser?.id : parseInt(id)

  // States
  const [profileUser, setProfileUser] = useState(isOwnProfile ? currentUser : null)
  const [loadingUser, setLoadingUser] = useState(!isOwnProfile)
  const [activeTab, setActiveTab] = useState('oglasi')
  
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)

  const [favorites, setFavorites] = useState([])
  const [loadingFavs, setLoadingFavs] = useState(false)

  // Editovanje profile stranice
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    location: '',
    bio: ''
  })

  // 1. Dohvatanje podataka o korisniku ako je u pitanju javni profil
  useEffect(() => {
    if (isOwnProfile) {
      setProfileUser(currentUser)
      setLoadingUser(false)
    } else if (id) {
      setLoadingUser(true)
      api.get(`/users/${id}`)
        .then(data => {
          setProfileUser(data)
        })
        .catch(err => {
          showToast('❌', 'Korisnik nije pronađen.')
          navigate('/404')
        })
        .finally(() => setLoadingUser(false))
    }
  }, [id, isOwnProfile, currentUser, navigate, showToast])

  // Postavljanje inicijalnih vrijednosti za edit formu kada se otvori modal
  useEffect(() => {
    if (profileUser) {
      setEditForm({
        firstName: profileUser.firstName || '',
        lastName: profileUser.lastName || '',
        location: profileUser.location || '',
        bio: profileUser.bio || ''
      })
    }
  }, [profileUser, isEditing])

  // 2. Dohvatanje oglasa tog korisnika
  useEffect(() => {
    if (!profileUserId) return
    setLoadingProducts(true)
    // json-server filtriranje po userId (ili sellerId u zavisnosti od db strukture)
    productsApi.getAll(`userId=${profileUserId}`)
      .then(data => setProducts(data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false))
  }, [profileUserId])

  // 3. Dohvatanje recenzija/dojmova za prodavača
  useEffect(() => {
    if (!profileUserId) return
    setLoadingReviews(true)
    // Koristimo reviewsApi sa _expand=reviewer ili slično ako json-server podržava
    api.get(`/user_reviews?sellerId=${profileUserId}`)
      .then(data => setReviews(data || []))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false))
  }, [profileUserId])

  // 4. Dohvatanje omiljenih artikala (samo ako je lični profil)
  useEffect(() => {
    if (!isOwnProfile || !currentUser?.id) return
    setLoadingFavs(true)
    api.get(`/favorites?userId=${currentUser.id}&_expand=product`)
      .then(data => setFavorites(data || []))
      .catch(() => setFavorites([]))
      .finally(() => setLoadingFavs(false))
  }, [isOwnProfile, currentUser?.id])

  // Pokretanje chata sa prodavačem
  const handleStartChat = async () => {
    if (!currentUser) {
      showToast('🔑', 'Morate se prijaviti da biste poslali poruku.')
      navigate('/login')
      return
    }
    try {
      // Kreiranje ili pronalazak konverzacije izmedju dva učesnika
      const participantOne = Math.min(currentUser.id, profileUserId)
      const participantTwo = Math.max(currentUser.id, profileUserId)
      const existing = await api.get(`/conversations?participant_one=${participantOne}&participant_two=${participantTwo}`)
      
      if (existing && existing.length > 0) {
        navigate(`/chat/${existing[0].id}`)
      } else {
        const newConvo = await api.post('/conversations', {
          participant_one: participantOne,
          participant_two: participantTwo,
          last_message_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        navigate(`/chat/${newConvo.id}`)
      }
    } catch (err) {
      showToast('❌', 'Nije moguće započeti chat.')
    }
  }

  // Snimanje izmjena na profilu
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      showToast('⚠️', 'Ime i prezime su obavezni.')
      return
    }
    try {
      const updated = await api.patch(`/users/${currentUser.id}`, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        location: editForm.location,
        bio: editForm.bio
      })
      
      setProfileUser(updated)
      setIsEditing(false)
      showToast('✅', 'Profil uspješno ažuriran!')
      if (refreshUser) await refreshUser() // Osvježava stanje u AuthContext-u
    } catch (err) {
      showToast('❌', 'Greška pri spremanju izmjena.')
    }
  }

  if (loadingUser) return <Spinner text="Učitavanje profila..." />
  if (!profileUser) return <div style={{ padding: 40, textAlign: 'center' }}>Korisnik nije pronađen.</div>

  // Generisanje inicijala za avatar
  const initials = `${profileUser.firstName?.charAt(0) || ''}${profileUser.lastName?.charAt(0) || ''}`.toUpperCase()

  return (
    <div className="profile-page-container" style={{ padding: '24px', maxWidth: '1050px', margin: '0 auto', paddingTop: '40px' }}>
      
      {/* ===== PROFILE HEADER CARTICA ===== */}
      <div className="profile-header-card" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        display: 'flex',
        gap: '24px',
        alignItems: 'center',
        marginBottom: '30px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div className="profile-avatar-large" style={{
          width: '84px',
          height: '84px',
          borderRadius: '99px',
          background: 'var(--green-light)',
          color: 'var(--green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          fontWeight: '700',
          flexShrink: 0,
          border: '2px solid var(--border)'
        }}>
          {initials}
        </div>

        <div className="profile-info-block" style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontFamily: 'Fraunces, serif', color: 'var(--text)' }}>
            {profileUser.firstName} {profileUser.lastName}
          </h2>
          <div style={{ color: 'var(--text-3)', fontSize: '14px', marginBottom: '10px', fontWeight: 500 }}>
            @{profileUser.username} • 📍 {profileUser.location || 'Nepoznata lokacija'}
          </div>
          {profileUser.bio ? (
            <p style={{ margin: '0 0 14px 0', fontSize: '14.5px', color: 'var(--text-2)', lineHeight: '1.5' }}>
              {profileUser.bio}
            </p>
          ) : (
            <p style={{ margin: '0 0 14px 0', fontSize: '13.5px', color: 'var(--text-3)', italic: 'true' }}>
              Korisnik nema napisanu biografiju.
            </p>
          )}

          {/* Stats Bar */}
          <div style={{ display: 'flex', gap: '20px', fontSize: '13.5px', color: 'var(--text-2)' }}>
            <span>⭐ <strong>{profileUser.avg_rating ? profileUser.avg_rating.toFixed(1) : '0.0'}</strong> Rejting</span>
            <span>📦 <strong>{profileUser.total_sales || 0}</strong> Prodano</span>
            <span>🛍️ <strong>{profileUser.total_purchases || 0}</strong> Kupljeno</span>
          </div>
        </div>

        {/* Akciono dugme na osnovu vlasništva */}
        <div className="profile-actions" style={{ alignSelf: 'flex-start' }}>
          {isOwnProfile ? (
            <button className="btn btn-sm" style={{ background: 'var(--bg-subtle)', color: 'var(--text)' }} onClick={() => setIsEditing(true)}>
              ⚙️ Uredi profil
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={handleStartChat}>
              💬 Pošalji poruku
            </button>
          )}
        </div>
      </div>

      {/* ===== TABS NAVIGACIJA ===== */}
      <div className="profile-tabs" style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border-light)',
        marginBottom: '24px',
        paddingBottom: '1px'
      }}>
        <button
          className={`tab-btn ${activeTab === 'oglasi' ? 'active' : ''}`}
          style={{
            padding: '12px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'oglasi' ? '2px solid var(--green)' : '2px solid transparent',
            color: activeTab === 'oglasi' ? 'var(--green)' : 'var(--text-3)',
            fontWeight: activeTab === 'oglasi' ? '600' : '500',
            cursor: 'pointer',
            fontSize: '14.5px'
          }}
          onClick={() => setActiveTab('oglasi')}
        >
          📦 Oglasi ({products.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'recenzije' ? 'active' : ''}`}
          style={{
            padding: '12px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'recenzije' ? '2px solid var(--green)' : '2px solid transparent',
            color: activeTab === 'recenzije' ? 'var(--green)' : 'var(--text-3)',
            fontWeight: activeTab === 'recenzije' ? '600' : '500',
            cursor: 'pointer',
            fontSize: '14.5px'
          }}
          onClick={() => setActiveTab('recenzije')}
        >
          ⭐ Dojmovi ({reviews.length})
        </button>
        {isOwnProfile && (
          <button
            className={`tab-btn ${activeTab === 'omiljeno' ? 'active' : ''}`}
            style={{
              padding: '12px 18px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'omiljeno' ? '2px solid var(--green)' : '2px solid transparent',
              color: activeTab === 'omiljeno' ? 'var(--green)' : 'var(--text-3)',
              fontWeight: activeTab === 'omiljeno' ? '600' : '500',
              cursor: 'pointer',
              fontSize: '14.5px'
            }}
            onClick={() => setActiveTab('omiljeno')}
          >
            ❤️ Omiljeno ({favorites.length})
          </button>
        )}
      </div>

      {/* ===== TAB CONTENT ===== */}
      <div className="tab-content">
        
        {/* TAB 1: OGLASI */}
        {activeTab === 'oglasi' && (
          loadingProducts ? <Spinner text="Učitavanje oglasa..." /> : 
          products.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>📦</div>
              Nema objavljenih oglasa na ovom profilu.
            </div>
          ) : (
            <div className="product-grid">
              {products.map(p => (
                <div key={p.id} className="pcard" onClick={() => navigate(`/product/${p.id}`)}>
                  <div className="pcard-img-placeholder" style={{ height: '170px', fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)' }}>
                    {p.emoji || '👕'}
                  </div>
                  <div style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="pcard-price" style={{ fontWeight: '700', color: 'var(--orange)', fontSize: '16px' }}>{p.price} KM</span>
                      <span className={`tag tag-sm`} style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-subtle)' }}>{p.condition?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="pcard-title" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>📍 {p.city || profileUser.location}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* TAB 2: RECENZIJE / DOJMOVI */}
        {activeTab === 'recenzije' && (
          loadingReviews ? <Spinner text="Učitavanje dojmova..." /> :
          reviews.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>⭐</div>
              Ovaj korisnik još uvijek nema nijedan dojam.
            </div>
          ) : (
            <div className="reviews-list" style={{ maxWidth: '700px' }}>
              {reviews.map(r => (
                <div key={r.id} className="review-card" style={{
                  padding: '16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '12px'
                }}>
                  <div className="review-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div className="review-avatar" style={{
                      width: '32px', height: '32px', borderRadius: '99px',
                      background: 'var(--denim-light)', color: 'var(--denim)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: '700'
                    }}>
                      👤
                    </div>
                    <div>
                      <div className="review-name" style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text)' }}>
                        Korisnik #{r.reviewerId}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--orange-mid)' }}>
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </div>
                    </div>
                    <span className="review-date" style={{ fontSize: '11px', color: 'var(--text-3)', marginLeft: 'auto' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('bs') : ''}
                    </span>
                  </div>
                  <p className="review-text" style={{ fontSize: '13.5px', color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
                    {r.comment}
                  </p>
                </div>
              ))}
            </div>
          )
        )}

        {/* TAB 3: OMILJENO */}
        {activeTab === 'omiljeno' && isOwnProfile && (
          loadingFavs ? <Spinner text="Učitavanje omiljenih oglasa..." /> :
          favorites.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>❤️</div>
              Nemate spašenih oglasa u omiljenim.
            </div>
          ) : (
            <div className="product-grid">
              {favorites.map(f => {
                const p = f.product
                if (!p) return null
                return (
                  <div key={f.id} className="pcard" onClick={() => navigate(`/product/${p.id}`)}>
                    <div className="pcard-img-placeholder" style={{ height: '170px', fontSize: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)' }}>
                      {p.emoji || '📦'}
                    </div>
                    <div style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span className="pcard-price" style={{ fontWeight: '700', color: 'var(--orange)', fontSize: '16px' }}>{p.price} KM</span>
                        <button 
                          style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '16px' }}
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              await api.delete(`/favorites/${f.id}`)
                              setFavorites(prev => prev.filter(item => item.id !== f.id))
                              showToast('💔', 'Uklonjeno iz omiljenih')
                            } catch {
                              showToast('❌', 'Greška pri uklanjanju')
                            }
                          }}
                        >
                          ❤️
                        </button>
                      </div>
                      <div className="pcard-title" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.title}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

      </div>

      {/* ===== EDIT PROFILE MODAL ===== */}
      {isEditing && (
        <div className="modal-backdrop" style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius-lg)',
            width: '100%', maxWidth: '460px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontFamily: 'Fraunces, serif', fontSize: '20px' }}>Uredi profil</h3>
            
            <form onSubmit={handleSaveProfile}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: '14px', flex: 1 }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Ime</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.firstName}
                    onChange={e => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '14px', flex: 1 }}>
                  <label className="form-label" style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Prezime</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.lastName}
                    onChange={e => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Grad / Lokacija</label>
                <select
                  className="form-select"
                  style={{ width: '100%' }}
                  value={editForm.location}
                  onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                >
                  <option value="Sarajevo">Sarajevo</option>
                  <option value="Mostar">Mostar</option>
                  <option value="Banja Luka">Banja Luka</option>
                  <option value="Tuzla">Tuzla</option>
                  <option value="Zenica">Zenica</option>
                  <option value="Ostalo">Ostalo</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Biografija (Bio)</label>
                <textarea
                  className="form-textarea"
                  style={{ width: '100%', height: '80px', resize: 'none' }}
                  placeholder="Recite nešto o sebi..."
                  value={editForm.bio}
                  onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsEditing(false)}>
                  Otkaži
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Spremi izmjene
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}