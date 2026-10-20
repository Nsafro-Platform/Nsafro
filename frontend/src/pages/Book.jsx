import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, formatDate, formatPrice } from '../api'
import { useAuth } from '../auth'
import { PanelSkeleton } from '../components/Loading'

const MAX_TRAVELLERS = 20

export default function Book() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [journey, setJourney] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [participantNames, setParticipantNames] = useState(user ? [user.fullName] : [''])
  const [formError, setFormError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .journey(id)
      .then((data) => {
        if (!cancelled) {
          setJourney(data.journey)
          // Seed the participant list with the signed-in user's name.
          const names = new Array(1).fill(user ? user.fullName : '')
          setParticipantNames(names)
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [id, user])

  if (loadError) {
    return (
      <div className="container">
        <p className="empty-state">
          {loadError} · <Link to="/journeys">Back to journeys</Link>
        </p>
      </div>
    )
  }
  if (!journey) {
    return (
      <section className="section">
        <div className="container narrow">
          <PanelSkeleton lines={5} label="Loading journey" />
        </div>
      </section>
    )
  }

  // The participant list is the single source of truth for the traveller count,
  // bounded by the seats the server says are still free.
  const travellers = participantNames.length
  const maxTravellers = Math.min(MAX_TRAVELLERS, journey.remainingSeats ?? journey.capacity)
  const soldOut = maxTravellers < 1
  const estimate = Number(journey.price) * travellers

  function addParticipant() {
    setParticipantNames((prev) => (prev.length >= maxTravellers ? prev : [...prev, '']))
  }

  function removeParticipant(index) {
    // The organizer keeps the first row; guests can be dropped while editing.
    setParticipantNames((prev) => prev.filter((_, i) => i !== index))
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
      const data = await api.createBooking({
        journeyId: Number(id),
        travellersCount: participantNames.length,
        participants: participantNames.map((fullName) => ({ fullName: fullName.trim() })),
      })
      navigate(`/bookings/${data.booking.id}/pay`)
    } catch (err) {
      setFormError(err.message)
      setBusy(false)
    }
  }

  return (
    <section className="section">
      <div className="container">
        <p className="page-sub">
          <Link to={`/journeys/${journey.id}`}>← Back to journey</Link>
        </p>
        <div className="detail-grid">
          <div>
            <h1 className="page-title">Book {journey.title}</h1>
            <p className="page-sub">
              {journey.destination} · {formatDate(journey.startDate)} – {formatDate(journey.endDate)}
            </p>

            {formError && <p className="alert alert-error">{formError}</p>}
            {soldOut && (
              <p className="alert alert-error">
                This journey is fully booked — no seat left for this departure.
              </p>
            )}

            <form onSubmit={onSubmit}>
              <div className="participants-head">
                <div>
                  <h2 className="sub-title">Travellers</h2>
                  <p className="hint">
                    {travellers} of {maxTravellers} seat{maxTravellers === 1 ? '' : 's'} still
                    available for this departure.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={addParticipant}
                  disabled={soldOut || travellers >= maxTravellers}
                >
                  + Add traveller
                </button>
              </div>

              {journey.isGroup ? (
                <p className="hint mb-16">
                  This is an organized <strong>group journey</strong> — every participant is listed on
                  the booking.
                </p>
              ) : null}

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
                      readOnly={i === 0 && Boolean(user)}
                    />
                    <span className="hint">
                      {i === 0 ? 'Organizer — confirmed on booking' : 'Guest — invitation pending'}
                    </span>
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

              <button type="submit" className="btn btn-primary" disabled={busy || soldOut}>
                {busy ? 'Creating booking…' : 'Continue to simulated payment'}
              </button>
            </form>
          </div>

          <aside className="booking-card" aria-label="Booking summary">
            <div className="price-line">{formatPrice(estimate)}</div>
            <p className="page-sub">
              {travellers} × {formatPrice(journey.price)} (per traveller)
            </p>
            <ul className="info-list">
              <li>
                <strong>Offer</strong>
                <span>{journey.title}</span>
              </li>
              <li>
                <strong>Departure</strong>
                <span>{formatDate(journey.startDate)}</span>
              </li>
              <li>
                <strong>Travellers</strong>
                <span>{travellers}</span>
              </li>
              <li>
                <strong>Booked by</strong>
                <span>{user?.email}</span>
              </li>
            </ul>
            <p className="hint mt-16">
              The exact total is recalculated server-side from the offer price stored in the
              database. Payment is a simulation only — no real charge.
            </p>
          </aside>
        </div>
      </div>
    </section>
  )
}
