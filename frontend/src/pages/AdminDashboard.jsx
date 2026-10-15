import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.adminStats()
      .then(data => setStats(data))
      .catch(err => setError(err.message))
  }, [])

  return (
    <section className="section">
      <div className="container">
        <h1>Admin Dashboard</h1>
        {error && <p className="alert alert-error">{error}</p>}
        {!stats && <p>Loading...</p>}
        {stats && (
          <div className="grid-cards" style={{ marginTop: '2rem' }}>
            <div className="card">
              <h3>Users</h3>
              <p>{stats.users.count} total ({stats.users.admins} admins)</p>
              <Link to="/admin/users" className="btn btn-outline">Manage Users</Link>
            </div>
            <div className="card">
              <h3>Journeys</h3>
              <p>{stats.journeys.count} total ({stats.journeys.published} published, {stats.journeys.drafts} drafts)</p>
              <Link to="/admin/journeys" className="btn btn-outline">Manage Journeys</Link>
            </div>
            <div className="card">
              <h3>Bookings</h3>
              <p>{stats.bookings.count} total ({stats.bookings.paid} paid)</p>
              <Link to="/admin/bookings" className="btn btn-outline">Manage Bookings</Link>
            </div>
            <div className="card">
              <h3>Quote Requests</h3>
              <p>{stats.quotes.count} total ({stats.quotes.submitted} submitted)</p>
              <Link to="/admin/quotes" className="btn btn-outline">Manage Quotes</Link>
            </div>
            <div className="card">
              <h3>Options</h3>
              <p>Manage journey options</p>
              <Link to="/admin/options" className="btn btn-outline">Manage Options</Link>
            </div>
            <div className="card">
              <h3>Destinations</h3>
              <p>View destinations</p>
              <Link to="/admin/destinations" className="btn btn-outline">Manage Destinations</Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
