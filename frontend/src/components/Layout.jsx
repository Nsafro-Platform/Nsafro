import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import logoImg from '../assets/logo.png'

const navLinkClass = ({ isActive }) => (isActive ? 'active' : undefined)

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <>
      <header className="site-header">
        <div className="container">
          <Link to="/" className="logo" aria-label="Nsafro home">
            <img src={logoImg} alt="" className="logo-img" />
            Nsafro
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/journeys" className={navLinkClass}>
              Journeys
            </NavLink>
            {user && (
              <NavLink to="/bookings" className={navLinkClass}>
                My bookings
              </NavLink>
            )}
            {user ? (
              <>
                {user.role === 'admin' && (
                  <NavLink to="/admin" className={navLinkClass}>
                    Admin
                  </NavLink>
                )}
                <NavLink to="/profile" className={navLinkClass}>
                  Profile
                </NavLink>
                <button type="button" className="btn btn-outline" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  Sign in
                </NavLink>
                <Link to="/register" className="btn btn-primary">
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
