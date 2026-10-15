import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, formatDate, formatPrice } from '../api'

function paymentBadge(booking) {
  if (booking.paymentStatus === 'paid') return <span className="badge green">Paid · confirmed</span>
  if (booking.paymentStatus === 'failed') return <span className="badge red">Payment failed</span>
  if (booking.status === 'cancelled') return <span className="badge gray">Cancelled</span>
  return <span className="badge yellow">Unpaid · pending</span>
}

export default function MyBookings() {
  const [bookings, setBookings] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .myBookings()
      .then((data) => setBookings(data.bookings))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">My bookings</h1>
        <p className="page-sub">Your booking history and payment state.</p>

        {error && <p className="alert alert-error">{error}</p>}
        {!error && !bookings && <p className="loading">Loading bookings…</p>}

        {bookings && bookings.length === 0 && (
          <p className="empty-state">
            No bookings yet. <Link to="/journeys">Browse journeys</Link> to make your first one.
          </p>
        )}

        {bookings && bookings.length > 0 && (
          <div className="table-wrap">
            <table className="bookings">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Journey</th>
                  <th>Departure</th>
                  <th>Travellers</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="ref">{booking.reference}</td>
                    <td>
                      <Link to={`/journeys/${booking.journeyId}`}>{booking.journey?.title}</Link>
                    </td>
                    <td>{formatDate(booking.journey?.startDate)}</td>
                    <td>{booking.travellersCount}</td>
                    <td>{formatPrice(booking.totalPrice)}</td>
                    <td>{paymentBadge(booking)}</td>
                    <td>
                      {booking.paymentStatus !== 'paid' && booking.status !== 'cancelled' && (
                        <Link to={`/bookings/${booking.id}/pay`} className="btn btn-primary" style={{ padding: '8px 16px' }}>
                          Pay
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
