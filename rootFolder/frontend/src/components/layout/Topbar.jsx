import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)
const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)
const CartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
)
const ChatIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
)

export default function Topbar() {
  const navigate  = useNavigate()
  const { user, logout, isAdmin } = useAuth()
  const { count } = useCart()
  const { theme, toggleTheme } = useTheme()
  const [query, setQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) navigate(`/?q=${encodeURIComponent(query.trim())}`)
    else navigate('/')
  }

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : ''

  return (
    <nav className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="logo">Thrift<span>ly</span></Link>

        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Pretraži hiljadu proizvoda..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button type="submit" className="search-bar-btn">
            <SearchIcon />
          </button>
        </form>

        <div className="nav-actions">
          {/* Dugme za Temu (kao tema a ne Temu platforma...) */}
          <button className="nav-icon-btn" title="Promijeni temu" onClick={toggleTheme}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Akcije vidljive samo Prijavljenim korisnicima */}
          {user && (
            <>
              {/* DUGME ZA NOVI OGLAS */}
              <button 
                className="btn btn-primary btn-sm" 
                onClick={() => navigate('/dodaj-oglas')}
                style={{ 
                  padding: '0 12px', 
                  fontSize: '13px', 
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: '34px',
                  marginRight: '4px'
                }}
              >
                <span>+</span> Novi oglas
              </button>

              {/* Poruke */}
              <button className="nav-icon-btn" title="Poruke" onClick={() => navigate('/chat')}>
                <ChatIcon />
              </button>

              {/* Korpa */}
              <button className="nav-icon-btn" title="Korpa" onClick={() => navigate('/cart')}>
                <CartIcon />
                {count > 0 && <span className="badge">{count}</span>}
              </button>
            </>
          )}

          {/* Profil i Login/Register sekcija */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '4px' }}>
              {/* Klik na ime/avatar vodi na profil */}
              <div 
                onClick={() => navigate('/profile')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer' 
                }}
                title="Moj Profil"
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '99px',
                  background: 'var(--green-light)', color: 'var(--green)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                }}>
                  {initials}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                  {user.firstName}
                </span>
              </div>

              {/* Dugme za odjavu */}
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => { logout(); navigate('/'); }}
                style={{ color: 'var(--red)', padding: '4px 8px' }}
              >
                Odjava
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>
                Prijava
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>
                Registracija
              </button>
            </div>
          )}

          {/* Admin dugme */}
          {isAdmin && (
            <button className="btn btn-sm" style={{ background: 'var(--orange-light)', color: 'var(--orange)', border: '1px solid var(--orange-light)' }}
              onClick={() => navigate('/admin')}>
              Admin
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}