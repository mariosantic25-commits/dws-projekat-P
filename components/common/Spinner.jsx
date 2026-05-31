export default function Spinner({ text = 'Učitavanje...' }) {
  return (
    <div className="spinner-wrap">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>{text}</p>
      </div>
    </div>
  )
}