import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, formatDate, formatPrice } from '../api'
import { PanelSkeleton } from '../components/Loading'

const MAX_TRAVELLERS = 20

// A traveller can change an unpaid booking: fewer/more travellers and a new
// participant list. The server re-checks capacity and keeps the price snapshot.
export default function EditBooking() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [booking, setBooking] = useState(null)
  const [participantNames, setParticipantNames] = useState([])
  const [error, setError] = useState(null)
  const [notAllowed, setNotAllowed] = useState(false)
  const [formError, setFormError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .booking(id)
      .then((data) => {
        if (cancelled) return
        setBooking(data.booking)
        const names = data.booking.participants.map((p) => p.fullName)
        setParticipantNames(names.length ? names : [''])
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
          <PanelSkeleton lines={5} label="Loading booking" />
        </div>
      </section>
    )
  }

  const locked = booking.paymentStatus === 'paid' || booking.status === 'cancelled'

  // Seats this booking already holds can be reused, plus whatever is still free.
  const maxTravellers = Math.min(
    MAX_TRAVELLERS,
    (booking.journey?.remainingSeats ?? 0) + booking.travellersCount
  )
  const travellers = participantNames.length
  const estimate = Number(booking.unitPrice) * travellers

  function addParticipant() {
    setParticipantNames((prev) => (prev.length >= maxTravellers ? prev : [...prev, '']))
  }

  function removeParticipant(index) {
    setParticipantNames((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  function setParticipantName(index, value) {
    setParticipantNames((prev) => prev.map((name, i) => (i === index ? value : name)))
  }

  async function onSubmit(event) {
    event.preventDefault()
    setFormError(null)

    for (const name of participantNames) {
      if (!name || !name.trim()) {
        setFormError('Please enter the full name of every traveller.')
        return
      }
    }

    setBusy(true)
    try {
      await api.updateBooking(id, {
        travellersCount: participantNames.length,
        participants: participantNames.map((fullName) => ({ fullName: fullName.trim() })),
      })
      navigate('/bookings')
    } catch (err) {
      setFormError(err.message)
      setBusy(false)
    }
  }

  return (
    <section className="section">
      <div className="container">
        <p className="page-sub">
          <Link to="/bookings">← Back to my bookings</Link>
        </p>
        <div className="detail-grid">
          <div>
            <h1 className="page-title">Modify booking {booking.reference}</h1>
            <p className="page-sub">
              {booking.journey?.title} · {formatDate(booking.journey?.startDate)}
            </p>

            {formError && <p className="alert alert-error">{formError}</p>}

            {locked ? (
              <div className="status-panel">
                <h2>This booking can no longer be modified</h2>
                <p>
                  {booking.status === 'cancelled'
                    ? 'It has been cancelled.'
                    : 'It is already paid — contact the agency to change it.'}
                </p>
                <div className="status-actions">
                  <Link to="/bookings" className="btn btn-primary">
                    Back to my bookings
                  </Link>
                  {booking.paymentStatus === 'paid' && (
                    <Link to={`/bookings/${booking.id}/ticket`} className="btn btn-outline">
                      View my e-ticket
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit}>
                <div className="participants-head">
                  <div>
                    <h2 className="sub-title">Travellers</h2>
                    <p className="hint">
                      {travellers} of {maxTravellers} places usable on this booking.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={addParticipant}
                    disabled={travellers >= maxTravellers}
                  >
                    + Add traveller
                  </button>
                </div>

                {participantNames.map((name, i) => (
                  <div className="participant-row" key={i}>
                    <div className="field grow">
                      <label htmlFor={`participant-${i}`}>
                        Traveller {i + 1}
                        {i === 0 ? ' (you)' : ''}
                      </label>
                      <input
                        id={`participant-${i}`}
                        type="text"
                        required
                        maxLength={200}
                        value={name}
                        onChange={(e) => setParticipantName(i, e.target.value)}
                      />
                    </div>
                    {i > 0 && (
                      <button
                        type="button"
                        className="btn btn-danger-outline"
                        onClick={() => removeParticipant(i)}
                        aria-label={`Remove traveller ${i + 1}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}

                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : 'Save changes'}
                </button>
              </form>
            )}
          </div>

          <aside className="booking-card" aria-label="Booking summary">
            <div className="price-line">{formatPrice(estimate)}</div>
            <p className="page-sub">
              {travellers} × {formatPrice(booking.unitPrice)} (price snapshot)
            </p>
            <ul className="info-list">
              <li>
                <strong>Reference</strong>
                <span>{booking.reference}</span>
              </li>
              <li>
                <strong>Departure</strong>
                <span>{formatDate(booking.journey?.startDate)}</span>
              </li>
              <li>
                <strong>Payment</strong>
                <span>{booking.paymentStatus}</span>
              </li>
            </ul>
            <p className="hint mt-16">
              Changes are only possible before payment. The total is recalculated
              server-side from the unit price recorded when the booking was created.
            </p>
          </aside>
        </div>
      </div>
    </section>
  )
}
