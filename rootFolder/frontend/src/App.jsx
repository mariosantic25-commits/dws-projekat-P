import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import Layout from './components/layout/Layout.jsx'

import AddProduct from './pages/AddProduct.jsx'

// Pages
import Home         from './pages/Home.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Cart         from './pages/Cart.jsx'
import Chat         from './pages/Chat.jsx'
import Profile      from './pages/Profile.jsx'
import About        from './pages/About.jsx'
import Contact      from './pages/Contact.jsx'
import Login        from './pages/Login.jsx'
import Register     from './pages/Register.jsx'
import Admin        from './pages/Admin.jsx'
import NotFound     from './pages/NotFound.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Auth pages — bez layouta (Topbar/Catbar) */}
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Sve ostale stranice — unutar Layouta */}
              <Route element={<Layout />}>
                <Route path="/"            element={<Home />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/about"       element={<About />} />
                <Route path="/contact"     element={<Contact />} />

                {/* Protected: ulogirani korisnici */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/cart"         element={<Cart />} />
                  <Route path="/chat"         element={<Chat />} />
                  <Route path="/chat/:id"     element={<Chat />} />
                  <Route path="/profile/:id"  element={<Profile />} />
                  <Route path="/profile"      element={<Profile />} />
                  
                  {/* nova ruta za dodavanje oglasa */}
                  <Route path="/dodaj-oglas"  element={<AddProduct />} />
                </Route>

                {/* Protected: samo admin */}
                <Route element={<ProtectedRoute adminOnly />}>
                  <Route path="/admin" element={<Admin />} />
                </Route>
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}