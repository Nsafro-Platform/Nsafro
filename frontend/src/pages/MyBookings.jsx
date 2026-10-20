import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, formatDate, formatPrice } from '../api'
import { TableSkeleton } from '../components/Loading'

function paymentBadge(item) {
  if (item.paymentStatus === 'paid') return <span className="badge green">Paid · confirmed</span>
  if (item.paymentStatus === 'failed') return <span className="badge red">Payment failed</span>
  if (item.status === 'cancelled') return <span className="badge gray">Cancelled</span>
  return <span className="badge yellow">Unpaid · pending</span>
}

// Which column text the "Journey" cell shows for each record kind.
function journeyCell(item) {
  if (item.kind !== 'reservation') {
    return <Link to={`/journeys/${item.journeyId}`}>{item.journey?.title}</Link>
  }
  // Journey-based reservations link back to the offer, CUSTOM ones list destinations.
  if (item.journey) return <Link to={`/journeys/${item.journey.id}`}>{item.journey.title}</Link>
  const destinations = item.selectedOptions?.destinations || []
  return <span>{destinations.length > 0 ? destinations.join(' · ') : 'Custom trip'}</span>
}

function typeBadge(item) {
  if (item.kind !== 'reservation') return null
  return <span className="badge blue">{item.reservationType.charAt(0) + item.reservationType.slice(1).toLowerCase()}</span>
}

export default function MyBookings() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    // Bookings and wizard reservations live in two tables; show them together as
    // one history, newest first.
    Promise.all([api.myBookings(), api.myReservations()])
      .then(([bookingData, reservationData]) => {
        if (cancelled) return
        const merged = [
          ...bookingData.bookings.map((b) => ({ kind: 'booking', ...b })),
          ...reservationData.reservations.map((r) => ({ kind: 'reservation', ...r })),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setItems(merged)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">My bookings</h1>
        <p className="page-sub">Your booking history and payment state.</p>

        {error && <p className="alert alert-error">{error}</p>}
        {!error && !items && <TableSkeleton rows={4} label="Loading bookings" />}

        {items && items.length === 0 && (
          <p className="empty-state">
            No bookings yet. <Link to="/journeys">Browse journeys</Link> or{' '}
            <Link to="/reserve">reserve a trip</Link> to make your first one.
          </p>
        )}

        {items && items.length > 0 && (
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
                {/* data-label feeds the stacked card headings shown on phones. */}
                {items.map((item) => (
                  <tr key={`${item.kind}-${item.id}`}>
                    <td className="ref" data-label="Reference">
                      {item.reference} {typeBadge(item)}
                    </td>
                    <td data-label="Journey">{journeyCell(item)}</td>
                    <td data-label="Departure">{formatDate(item.journey?.startDate)}</td>
                    <td data-label="Travellers">
                      {item.travellersCount}
                      {item.participants && item.participants.length > 0 && (
                        <span className="traveller-names">
                          {item.participants.map((p) => p.fullName).join(', ')}
                        </span>
                      )}
                    </td>
                    <td data-label="Total">{formatPrice(item.totalPrice ?? item.pricing?.total)}</td>
                    <td data-label="Status">{paymentBadge(item)}</td>
                    <td data-label="">
                      {item.paymentStatus !== 'paid' && item.status !== 'cancelled' && (
                        <Link
                          to={
                            item.kind === 'reservation'
                              ? `/reservations/${item.id}/pay`
                              : `/bookings/${item.id}/pay`
                          }
                          className="btn btn-sm btn-primary"
                        >
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
