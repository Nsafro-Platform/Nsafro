import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, formatDate, formatPrice } from '../api'
import { PanelSkeleton } from '../components/Loading'

// Printable e-ticket for a paid booking. It is generated from the booking
// snapshot server-side (reference, journey dates, participants, paid amount),
// so what the traveller prints is exactly what the agency has on file.
export default function ETicket() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState(null)
  const [notAllowed, setNotAllowed] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .booking(id)
      .then((data) => {
        if (!cancelled) setBooking(data.booking)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.status === 403 || err.status === 404) setNotAllowed(true)
        else setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (notAllowed) {
    return (
      <div className="container">
        <p className="empty-state">
          This booking does not exist under your account.{' '}
          <Link to="/bookings">View your bookings</Link>
        </p>
      </div>
    )
  }
  if (error) {
    return (
      <div className="container">
        <p className="alert alert-error">{error}</p>
      </div>
    )
  }
  if (!booking) {
    return (
      <section className="section">
        <div className="container narrow">
          <PanelSkeleton lines={5} label="Loading e-ticket" />
        </div>
      </section>
    )
  }

  // The ticket only exists once the booking is paid and confirmed.
  if (booking.paymentStatus !== 'paid') {
    return (
      <section className="section">
        <div className="container narrow">
          <div className="status-panel">
            <h1>E-ticket not available yet</h1>
            <p>
              Booking <strong>{booking.reference}</strong> is not paid, so no e-ticket can be
              issued. Complete the simulated payment to receive it.
            </p>
            <div className="status-actions">
              <Link to={`/bookings/${booking.id}/pay`} className="btn btn-primary">
                Go to payment
              </Link>
              <Link to="/bookings" className="btn btn-outline">
                My bookings
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container narrow">
        <p className="page-sub no-print">
          <Link to="/bookings">← Back to my bookings</Link>
        </p>

        <article className="ticket" aria-label="E-ticket">
          <header className="ticket-head">
            <div>
              <p className="subheading">Nsafro · e-ticket</p>
              <h1>{booking.journey?.title}</h1>
              <p className="page-sub">
                {booking.journey?.destination} · {formatDate(booking.journey?.startDate)} –{' '}
                {formatDate(booking.journey?.endDate)}
              </p>
            </div>
            <div className="ticket-ref">
              <span>Booking reference</span>
              <strong>{booking.reference}</strong>
            </div>
          </header>

          <ul className="ticket-grid">
            <li>
              <span>Departure</span>
              <strong>{formatDate(booking.journey?.startDate)}</strong>
            </li>
            <li>
              <span>Return</span>
              <strong>{formatDate(booking.journey?.endDate)}</strong>
            </li>
            <li>
              <span>Duration</span>
              <strong>{booking.journey?.durationDays} days</strong>
            </li>
            <li>
              <span>Transport</span>
              <strong>{booking.journey?.transport || 'Per itinerary'}</strong>
            </li>
            <li>
              <span>Travellers</span>
              <strong>{booking.travellersCount}</strong>
            </li>
            <li>
              <span>Total paid</span>
              <strong>{formatPrice(booking.totalPrice)}</strong>
            </li>
          </ul>

          {booking.participants && booking.participants.length > 0 && (
            <>
              <h2 className="sub-title">Travellers on this booking</h2>
              <table className="ticket-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Full name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.participants.map((p, i) => (
                    <tr key={p.id}>
                      <td>{i + 1}</td>
                      <td>{p.fullName}</td>
                      <td>{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <footer className="ticket-foot">
            <span>Present this reference at check-in: {booking.reference}</span>
            <span className="badge green">Paid · confirmed</span>
          </footer>
        </article>

        <div className="actions-row no-print">
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            Print / save as PDF
          </button>
          <Link to="/bookings" className="btn btn-outline">
            My bookings
          </Link>
        </div>
        <p className="hint mt-16 no-print">
          Payment on this demo platform is simulated — no real charge was made.
        </p>
      </div>
    </section>
  )
}
