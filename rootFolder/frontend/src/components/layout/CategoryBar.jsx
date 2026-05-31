import { useNavigate, useSearchParams } from 'react-router-dom'

const CATEGORIES = [
  { value: '',           label: '✦ Sve' },
  { value: 'odjeca',     label: '👕 Odjeća' },
  { value: 'obuca',      label: '👟 Obuća' },
  { value: 'elektronika',label: '📱 Elektronika' },
  { value: 'knjige',     label: '📚 Knjige' },
  { value: 'namjestaj',  label: '🛋️ Namještaj' },
  { value: 'sport',      label: '🏋️ Sport' },
  { value: 'kuhinja',    label: '🍳 Kuhinja' },
  { value: 'igracke',    label: '🎮 Igračke' },
  { value: 'ostalo',     label: '📦 Ostalo' },
]

export default function CategoryBar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const active = searchParams.get('category') || ''

  const handleClick = (value) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set('category', value)
    else params.delete('category')
    // Resetuj stranicu pri promjeni kategorije
    params.delete('page')
    navigate(`/?${params.toString()}`)
  }

  return (
    <div className="catbar">
      <div className="catbar-inner">
        {CATEGORIES.map((cat, idx) => (
          <button
            key={cat.value}
            className={`cat-btn ${active === cat.value ? 'active' : ''}`}
            onClick={() => handleClick(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  )
}