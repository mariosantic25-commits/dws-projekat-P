import { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../api/index.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('thriftly_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (email, password) => {
    const users = await api.get(`/users?email=${encodeURIComponent(email)}`)
    if (!users.length) throw new Error('Korisnik s tim emailom ne postoji.')

    const found = users[0]
    // U produkciji: bcrypt usporedba. Ovdje: plain usporedba za json-server demo.
    if (found.password !== password) throw new Error('Pogrešna lozinka.')
    if (!found.is_active) throw new Error('Vaš račun je suspendiran.')

    const { password: _pw, ...safeUser } = found
    setUser(safeUser)
    localStorage.setItem('thriftly_user', JSON.stringify(safeUser))
    return safeUser
  }, [])

  const register = useCallback(async ({ firstName, lastName, username, email, password, location }) => {
    // Provjera duplikata
    const existing = await api.get(`/users?email=${encodeURIComponent(email)}`)
    if (existing.length) throw new Error('Korisnik s tim emailom već postoji.')

    const existingUsername = await api.get(`/users?username=${encodeURIComponent(username)}`)
    if (existingUsername.length) throw new Error('Korisničko ime je zauzeto.')

    const newUser = {
      firstName,
      lastName,
      username,
      email,
      password, // U produkciji: hash lozinku
      location,
      is_admin: false,
      is_active: true,
      avg_rating: 0,
      total_sales: 0,
      total_purchases: 0,
      created_at: new Date().toISOString(),
    }

    const created = await api.post('/users', newUser)
    const { password: _pw, ...safeUser } = created
    setUser(safeUser)
    localStorage.setItem('thriftly_user', JSON.stringify(safeUser))
    return safeUser
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('thriftly_user')
  }, [])

  // Osvježi user podatke iz baze (npr. nakon promjene profila)
  const refreshUser = useCallback(async () => {
    if (!user?.id) return
    const fresh = await api.get(`/users/${user.id}`)
    const { password: _pw, ...safeUser } = fresh
    setUser(safeUser)
    localStorage.setItem('thriftly_user', JSON.stringify(safeUser))
  }, [user?.id])

  const isAdmin = user?.is_admin === true

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}