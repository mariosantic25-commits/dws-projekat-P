import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { productsApi, favoritesApi, usersApi } from '../api/index.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Spinner from '../components/common/Spinner.jsx'

const CONDITIONS = ['novo_s_etiketom','kao_novo','dobro','prihvatljivo']
const CONDITION_LABELS = {
  novo_s_etiketom: 'Novo s etiketom',
  kao_novo: 'Kao novo',
  dobro: 'Dobro',
  prihvatljivo: 'Prihvatljivo',
}
const CITIES = ['Sarajevo','Mostar','Banja Luka','Tuzla','Zenica']

function conditionTag(c) {
  if (c === 'novo_s_etiketom') return 'tag-green'
  if (c === 'kao_novo') return 'tag-denim'
  if (c === 'dobro') return 'tag-brown'
  return 'tag-orange'
}

// PAMETNA KARTICA KOJA AUTOMATSKI PRIKAZUJE EMOJI AKO SLIKA NE POSTOJI
function ProductCard({ product, favorites, onToggleFav }) {
  const navigate = useNavigate()
  const isFav = favorites.has(product.id)
  
  // Lokalni state koji prati da li je učitavanje slike propalo
  const [imgError, setImgError] = useState(false)

  return (
    <div className="pcard" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="pcard-img-placeholder" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
        {/* Ako putanja postoji I ako slika nije izbacila grešku pri učitavanju */}
        {product.image && !imgError ? (
          <img 
            src={product.image} 
            alt={product.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            onError={() => setImgError(true)} // Ako slika ne postoji u folderu, prebaci na emoji!
          />
        ) : (
          <span style={{ fontSize: '40px' }}>{product.emoji || '📦'}</span>
        )}
      </div>
      
      <div className="pcard-condition">
        <span className={`tag ${conditionTag(product.condition_lvl)}`}>
          {CONDITION_LABELS[product.condition_lvl]}
        </span>
      </div>
      <button
        className={`pcard-fav ${isFav ? 'active' : ''}`}
        onClick={e => { e.stopPropagation(); onToggleFav(product) }}
      >
        {isFav ? '♥' : '♡'}
      </button>
      <div className="pcard-body">
        <div className="pcard-title">{product.title}</div>
        <div className="pcard-price">{product.price} KM</div>
        <div className="pcard-meta">
          <div className="pcard-seller">
            <div className="pcard-seller-avatar">
              {product.sellerName?.[0]?.toUpperCase() || '?'}
            </div>
            {product.sellerName || 'Prodavač'}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>⭐ {product.avg_rating}</span>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [products, setProducts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [favorites, setFavorites]   = useState(new Set())
  const [favMap, setFavMap]         = useState({})
  const [priceMin, setPriceMin]     = useState('')
  const [priceMax, setPriceMax]     = useState('')
  const [selConditions, setSelConditions] = useState(new Set(CONDITIONS))
  const [selCities, setSelCities]   = useState(new Set())
  const [sort, setSort]             = useState('novo')

  const qParam   = searchParams.get('q') || ''
  const catParam = searchParams.get('category') || ''

  useEffect(() => {
    setLoading(true)
    const params = catParam ? `status=active&category=${catParam}` : 'status=active'
    productsApi.getAll(params)
      .then(async data => {
        const userIds = [...new Set(data.map(p => p.sellerId))]
        const usersArr = await Promise.all(userIds.map(id => usersApi.getById(id).catch(() => null)))
        const usersMap = {}
        usersArr.forEach(u => { if (u) usersMap[u.id] = u })
        setProducts(data.map(p => ({
          ...p,
          sellerName: usersMap[p.sellerId]
            ? `${usersMap[p.sellerId].firstName} ${usersMap[p.sellerId].lastName}`
            : 'Nepoznat',
        })))
      })
      .catch(() => showToast('⚠️', 'Greška pri učitavanju.'))
      .finally(() => setLoading(false))
  }, [catParam])

  useEffect(() => {
    if (!user?.id) { setFavorites(new Set()); setFavMap({}); return }
    favoritesApi.getByUser(user.id).then(favs => {
      setFavorites(new Set(favs.map(f => f.productId)))
      const map = {}; favs.forEach(f => { map[f.productId] = f.id })
      setFavMap(map)
    }).catch(() => {})
  }, [user?.id])

  const toggleFav = async (product) => {
    if (!user) { showToast('🔒', 'Prijavite se za omiljene.'); return }
    if (favorites.has(product.id)) {
      await favoritesApi.remove(favMap[product.id])
      setFavorites(prev => { const s = new Set(prev); s.delete(product.id); return s })
      setFavMap(prev => { const m = { ...prev }; delete m[product.id]; return m })
      showToast('♡', 'Uklonjeno iz omiljenih.')
    } else {
      const fav = await favoritesApi.add(user.id, product.id)
      setFavorites(prev => new Set([...prev, product.id]))
      setFavMap(prev => ({ ...prev, [product.id]: fav.id }))
      showToast('♥', 'Dodano u omiljene!')
    }
  }

  const toggleCondition = c => setSelConditions(prev => {
    const s = new Set(prev); s.has(c) ? s.delete(c) : s.add(c); return s
  })
  const toggleCity = c => setSelCities(prev => {
    const s = new Set(prev); s.has(c) ? s.delete(c) : s.add(c); return s
  })

  let filtered = products.filter(p => {
    if (qParam && !p.title.toLowerCase().includes(qParam.toLowerCase())) return false
    if (!selConditions.has(p.condition_lvl)) return false
    if (selCities.size > 0 && !selCities.has(p.location)) return false
    if (priceMin !== '' && p.price < Number(priceMin)) return false
    if (priceMax !== '' && p.price > Number(priceMax)) return false
    return true
  })
  if (sort === 'cjeftino') filtered = [...filtered].sort((a,b) => a.price - b.price)
  else if (sort === 'skupo') filtered = [...filtered].sort((a,b) => b.price - a.price)
  else if (sort === 'ocjena') filtered = [...filtered].sort((a,b) => b.avg_rating - a.avg_rating)
  else filtered = [...filtered].sort((a,b) => new Date(b.created_at) - new Date(a.created_at))

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <div className="filter-title">
          Filteri
          <button className="btn btn-ghost btn-sm" style={{ fontSize:12, padding:'4px 8px' }}
            onClick={() => { setPriceMin(''); setPriceMax(''); setSelConditions(new Set(CONDITIONS)); setSelCities(new Set()) }}>
            Resetuj
          </button>
        </div>
        
        <div className="filter-section">
          <span className="filter-label">Cijena (KM)</span>
          <div className="price-inputs" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <input 
              className="price-input" 
              style={{ width: '100%', boxSizing: 'border-box' }} 
              type="number" 
              placeholder="Minimalna (npr. 0)" 
              value={priceMin} 
              onChange={e => setPriceMin(e.target.value)} 
            />
            <input 
              className="price-input" 
              style={{ width: '100%', boxSizing: 'border-box' }} 
              type="number" 
              placeholder="Maksimalna (npr. 500)" 
              value={priceMax} 
              onChange={e => setPriceMax(e.target.value)} 
            />
          </div>
        </div>

        <div className="filter-section">
          <span className="filter-label">Stanje</span>
          <div className="filter-options">
            {CONDITIONS.map(c => (
              <label key={c} className="filter-option">
                <input type="checkbox" checked={selConditions.has(c)} onChange={() => toggleCondition(c)} />
                {CONDITION_LABELS[c]}
              </label>
            ))}
          </div>
        </div>
        <div className="filter-section">
          <span className="filter-label">Lokacija</span>
          <div className="filter-options">
            {CITIES.map(c => (
              <label key={c} className="filter-option">
                <input type="checkbox" checked={selCities.has(c)} onChange={() => toggleCity(c)} />
                {c}
              </label>
            ))}
          </div>
        </div>
      </aside>

      <main>
        <div className="grid-header">
          <div>
            <span className="section-title">
              {qParam ? `Rezultati za "${qParam}"` : 'Novo na Thriftly'}
            </span>
            <span className="count">• {filtered.length.toLocaleString()} oglasa</span>
          </div>
          <select className="sort-select" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="novo">Najnovije</option>
            <option value="cjeftino">Cijena ↑</option>
            <option value="skupo">Cijena ↓</option>
            <option value="ocjena">Najbolje ocijenjeni</option>
          </select>
        </div>
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">🔍</div>Nema rezultata za trenutne filtere.</div>
        ) : (
          <div className="product-grid">
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} favorites={favorites} onToggleFav={toggleFav} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}