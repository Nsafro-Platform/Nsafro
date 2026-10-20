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
        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table className="bookings">
            <thead>
              <tr><th>Ref</th><th>Journey</th><th>User</th><th>Travellers</th><th>Total</th><th>Status</th><th>Payment</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {/* data-label feeds the stacked card headings shown on phones. */}
              {bookings.map(b => (
                <tr key={b.id}>
                  <td className="ref" data-label="Ref">{b.reference}</td>
                  <td data-label="Journey">{b.journey.title}</td>
                  <td data-label="User">{b.user.email}</td>
                  <td data-label="Travellers">{b.travellersCount}</td>
                  <td data-label="Total">{b.totalPrice}</td>
                  <td data-label="Status">{b.status}</td>
                  <td data-label="Payment">{b.paymentStatus}</td>
                  <td data-label="Actions">
                    <div className="form-row">
                      <select disabled={busy} value={b.status} onChange={(e) => update(b.id, { status: e.target.value })} aria-label={`Booking status for ${b.reference}`}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select disabled={busy} value={b.paymentStatus} onChange={(e) => update(b.id, { paymentStatus: e.target.value })} aria-label={`Payment status for ${b.reference}`}>
                        {PAY.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
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
