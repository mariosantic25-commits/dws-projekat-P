import { useState, useEffect } from 'react'
import { api } from '../api/index.js'
import Spinner from '../components/common/Spinner.jsx'
import { useToast } from '../context/ToastContext.jsx'

export default function Admin() {
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  // Dohvati sve podatke za admin prikaz
  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/users'),
      api.get('/products')
    ])
    .then(([u, p]) => {
      setUsers(u)
      setProducts(p)
    })
    .catch(() => showToast('❌', 'Greška pri učitavanju podataka.'))
    .finally(() => setLoading(false))
  }, [showToast])

  const handleDeleteProduct = async (id) => {
    if(!window.confirm('Jeste li sigurni da želite obrisati ovaj oglas?')) return
    try {
      await api.delete(`/products/${id}`)
      setProducts(prev => prev.filter(p => p.id !== id))
      showToast('🗑️', 'Proizvod uspješno obrisan.')
    } catch (err) {
      showToast('❌', 'Brisanje nije uspjelo.')
    }
  }

  if (loading) return <Spinner text="Učitavanje admin panela..." />

  return (
    <div className="admin-layout">
      {/* Bočna Navigacija (Sidebar) */}
      <aside className="admin-nav">
        <div className="admin-nav-title">Upravljanje</div>
        <button 
          className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`} 
          onClick={() => setActiveTab('users')}
        >
          👤 Korisnici ({users.length})
        </button>
        <button 
          className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`} 
          onClick={() => setActiveTab('products')}
        >
          📦 Proizvodi ({products.length})
        </button>
      </aside>

      {/* Glavni sadržaj desno */}
      <main style={{ minWidth: 0 }}>
        <h1 className="section-title" style={{ marginBottom: '24px' }}>Admin Panel</h1>
        
        {/* Statističke kartice koje popunjavaju prazan prostor na vrhu */}
        <div className="admin-stat-grid">
          <div className="admin-stat">
            <div className="admin-stat-label">Ukupno Korisnika</div>
            <div className="admin-stat-value">{users.length}</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-label">Aktivni Proizvodi</div>
            <div className="admin-stat-value">{products.length}</div>
          </div>
        </div>

        {/* Tab: Korisnici */}
        {activeTab === 'users' && (
          <div className="admin-table-wrap">
            <div className="admin-table-header">
              <h2 className="admin-table-title">Pregled Registrovanih Korisnika</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>ID</th>
                    <th>Korisnik</th>
                    <th>Email</th>
                    <th>Lokacija</th>
                    <th>Uloga</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ color: 'var(--text-3)' }}>#{u.id}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>@{u.username}</div>
                      </td>
                      <td>{u.email}</td>
                      <td>{u.location}</td>
                      <td>
                        {u.is_admin ? (
                          <span className="tag tag-orange">Admin</span>
                        ) : (
                          <span className="tag tag-green">Korisnik</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)' }}>
                        Nema registrovanih korisnika.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Proizvodi */}
        {activeTab === 'products' && (
          <div className="admin-table-wrap">
            <div className="admin-table-header">
              <h2 className="admin-table-title">Pregled Aktivnih Oglasa</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>ID</th>
                    <th>Naziv</th>
                    <th>Kategorija</th>
                    <th>Cijena</th>
                    <th style={{ width: '100px' }}>Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td style={{ color: 'var(--text-3)' }}>#{p.id}</td>
                      <td style={{ fontWeight: 500 }}>
                        <span style={{ marginRight: '6px' }}>{p.emoji}</span>
                        {p.title}
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                      <td style={{ fontWeight: 600, color: 'var(--green)' }}>{p.price} KM</td>
                      <td>
                        <button 
                          className="table-action ta-danger" 
                          onClick={() => handleDeleteProduct(p.id)}
                        >
                          Obriši
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)' }}>
                        Nema dostupnih proizvoda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}