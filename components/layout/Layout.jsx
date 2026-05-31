import { Outlet, useLocation } from 'react-router-dom'
import Topbar from './Topbar.jsx'
import CategoryBar from './CategoryBar.jsx'
import Footer from './Footer.jsx'

// Stranice gdje NE prikazujemo CategoryBar
const NO_CATBAR = ['/about', '/contact', '/cart', '/chat', '/profile', '/admin', '/dodaj-oglas']

export default function Layout() {
  const { pathname } = useLocation()
  const showCatbar = !NO_CATBAR.some(p => pathname.startsWith(p))

  return (
    <>
      <Topbar />
      {showCatbar && <CategoryBar />}
      
      {/* Samo jedan div i jedan Outlet su dovoljni */}
      <div className={showCatbar ? 'page-wrap' : 'page-wrap-no-catbar'}>
        <Outlet />
      </div>

      <Footer />
    </>
  )
}