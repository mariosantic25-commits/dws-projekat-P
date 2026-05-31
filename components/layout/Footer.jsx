import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border-light)', padding: '24px', textAlign: 'center', marginTop: '60px', color: 'var(--text-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '12px' }}>
        <Link to="/about" style={{ color: 'var(--text-2)', textDecoration: 'none', fontWeight: 500 }}>O nama</Link>
        <Link to="/contact" style={{ color: 'var(--text-2)', textDecoration: 'none', fontWeight: 500 }}>Kontakt i Lokacija</Link>
      </div>
      <p style={{ fontSize: '13px' }}>© 2026 Thriftly Marketplace. Sva prava zadržana.</p>
    </footer>
  )
}