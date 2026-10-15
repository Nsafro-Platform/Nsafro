import { Link } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Profile() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <section className="section">
      <div className="container">
        <div className="form-card">
          <h1>Profile</h1>
          <p className="lead">Your account details.</p>
          <ul className="info-list">
            <li>
              <strong>Full name</strong>
              <span>{user.fullName}</span>
            </li>
            <li>
              <strong>Email</strong>
              <span>{user.email}</span>
            </li>
            <li>
              <strong>Role</strong>
              <span>
                {user.role === 'admin' ? (
                  <span className="badge">Admin</span>
                ) : (
                  <span className="badge gray">Traveller</span>
                )}
              </span>
            </li>
          </ul>
          <Link to="/bookings" className="btn btn-primary" style={{ marginTop: 20 }}>
            View my bookings
          </Link>
        </div>
      </div>
    </section>
  )
}
