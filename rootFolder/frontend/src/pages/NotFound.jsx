import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="not-found-page" style={{ paddingTop: 'var(--nav-h)' }}>
      <div className="not-found-code">404</div>
      <div className="not-found-title">Stranica nije pronađena</div>
      <div className="not-found-sub">
        Izgleda da je ovaj oglas već prodan — ili nikad nije ni postojao.
      </div>
      <Link to="/" className="btn btn-primary">
        ← Nazad na početnu
      </Link>
    </div>
  )
}