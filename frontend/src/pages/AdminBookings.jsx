import { useEffect, useState } from 'react'
import { api } from '../api'

const STATUSES = ['pending', 'confirmed', 'cancelled']
const PAY = ['pending', 'paid', 'failed', 'refunded']

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      const data = await api.adminBookings()
      setBookings(data.bookings)
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => { load() }, [])

  async function update(id, payload) {
    setBusy(true)
    try {
      await api.adminUpdateBooking(id, payload)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section">
      <div className="container">
        <h1>Bookings</h1>
        {error && <p className="alert alert-error">{error}</p>}
        <div className="card" style={{ marginTop: '1rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 800 }}>
            <thead>
              <tr><th>Ref</th><th>Journey</th><th>User</th><th>Travellers</th><th>Total</th><th>Status</th><th>Payment</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td>{b.reference}</td>
                  <td>{b.journey.title}</td>
                  <td>{b.user.email}</td>
                  <td>{b.travellersCount}</td>
                  <td>{b.totalPrice}</td>
                  <td>{b.status}</td>
                  <td>{b.paymentStatus}</td>
                  <td>
                    <select disabled={busy} value={b.status} onChange={(e) => update(b.id, { status: e.target.value })}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select disabled={busy} value={b.paymentStatus} onChange={(e) => update(b.id, { paymentStatus: e.target.value })} style={{ marginLeft: 8 }}>
                      {PAY.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
