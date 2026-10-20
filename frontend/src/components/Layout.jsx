import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import logoImg from '../assets/logo.png'

const navLinkClass = ({ isActive }) => (isActive ? 'active' : undefined)

const NAV_ID = 'site-nav'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // The navigation collapses behind a menu button on narrow viewports; on wide
  // viewports the panel is always visible and this state is unused.
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  // A route change (browser back/forward, redirect) should never leave the panel
  // hanging open, so the state is adjusted during render rather than in an effect.
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setMenuOpen(false)
  }

  async function handleLogout() {
    closeMenu()
    await logout()
    navigate('/')
  }

  return (
    <>
      <header className="site-header">
        <div className="container">
          <Link to="/" className="logo" aria-label="Nsafro home" onClick={closeMenu}>
            <img src={logoImg} alt="" className="logo-img" />
            Nsafro
          </Link>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls={NAV_ID}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="nav-toggle-icon" aria-hidden="true">
              {menuOpen ? '✕' : '☰'}
            </span>
            <span className="nav-toggle-label">{menuOpen ? 'Close' : 'Menu'}</span>
          </button>

          <nav
            id={NAV_ID}
            className={`site-nav${menuOpen ? ' open' : ''}`}
            aria-label="Main navigation"
          >
            <NavLink to="/" end className={navLinkClass} onClick={closeMenu}>
              Home
            </NavLink>
            <NavLink to="/journeys" className={navLinkClass} onClick={closeMenu}>
              Journeys
            </NavLink>
            {user && (
              <NavLink to="/reserve" className={navLinkClass} onClick={closeMenu}>
                Reserve
              </NavLink>
            )}
            {user && (
              <NavLink to="/bookings" className={navLinkClass} onClick={closeMenu}>
                My bookings
              </NavLink>
            )}
            {user ? (
              <>
                {user.role === 'admin' && (
                  <NavLink to="/admin" className={navLinkClass} onClick={closeMenu}>
                    Admin
                  </NavLink>
                )}
                <NavLink to="/profile" className={navLinkClass} onClick={closeMenu}>
                  Profile
                </NavLink>
                <button type="button" className="btn btn-outline" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass} onClick={closeMenu}>
                  Sign in
                </NavLink>
                <Link to="/register" className="btn btn-primary" onClick={closeMenu}>
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="cols">
            <div>
              <Link to="/" className="logo">
                <img src={logoImg} alt="" className="logo-img" />
                Nsafro
              </Link>
              <p className="desc">Book your trip in minute, get full Control for much longer.</p>
            </div>
            <nav aria-label="Footer navigation">
              <h4>Company</h4>
              <ul>
                <li>
                  <Link to="/journeys">Journeys</Link>
                </li>
                <li>
                  <Link to="/register">Create account</Link>
                </li>
              </ul>
            </nav>
            <nav aria-label="Support">
              <h4>Support</h4>
              <ul>
                <li>Help/FAQ</li>
                <li>Press</li>
                <li>Affilates</li>
              </ul>
            </nav>
          </div>
          <p className="copyright">All rights reserved © Nsafro — demo application, payments are simulated.</p>
        </div>
      </footer>
    </>
  )
}
