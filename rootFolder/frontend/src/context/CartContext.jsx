import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api/index.js'
import { useAuth } from './AuthContext.jsx'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  // Učitaj korpu kad se user prijavi
  useEffect(() => {
    if (!user?.id) { setItems([]); return }
    setLoading(true)
    api.get(`/cart_items?userId=${user.id}&_expand=product`)
      .then(data => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [user?.id])

  const addItem = useCallback(async (product) => {
    if (!user?.id) return false
    // Sprječava duplikat
    const exists = items.find(i => i.productId === product.id)
    if (exists) return 'duplicate'

    const newItem = {
      userId: user.id,
      productId: product.id,
      added_at: new Date().toISOString(),
    }
    const created = await api.post('/cart_items', newItem)
    // Dodaj product lokalno za prikaz, ne šalji na server
    setItems(prev => [...prev, { ...created, product }])
    return true
  }, [user?.id, items])

  const removeItem = useCallback(async (cartItemId) => {
    // Ukloni iz lokalnog statea odmah, bez obzira na server odgovor
    setItems(prev => prev.filter(i => i.id !== cartItemId))
    try {
      await api.delete(`/cart_items/${cartItemId}`)
    } catch (err) {
      // Item možda više ne postoji u bazi (npr. baza resetovana) — ignorišemo grešku
      console.warn(`Cart item ${cartItemId} nije pronađen na serveru, uklonjen lokalno.`)
    }
  }, [])

  const clearCart = useCallback(async () => {
    const currentItems = [...items]
    // Očisti lokalni state odmah
    setItems([])
    // Pokušaj obrisati sa servera, ignoriši greške za stavke koje ne postoje
    await Promise.allSettled(currentItems.map(i => api.delete(`/cart_items/${i.id}`)))
  }, [items])

  const total = items.reduce((sum, i) => sum + (i.product?.price || 0), 0)
  const count = items.length

  return (
    <CartContext.Provider value={{ items, loading, addItem, removeItem, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
