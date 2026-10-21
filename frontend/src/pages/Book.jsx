import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, formatDate, formatPrice } from '../api'
import { useAuth } from '../auth'
import { PanelSkeleton } from '../components/Loading'

export default function Book() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [journey, setJourney] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [travellers, setTravellers] = useState(1)
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

  const estimate = Number(journey.price) * travellers

  function setTravellerCount(next) {
    const count = Math.max(1, Math.min(20, Number(next) || 1))
    setTravellers(count)
    setParticipantNames((prev) => {
      const names = [...prev]
      while (names.length < count) names.push('')
      names.length = count
      if (names[0] === '' && user) names[0] = user.fullName
      return names
    })
  }

  function setParticipantName(index, value) {
    setParticipantNames((prev) => prev.map((name, i) => (i === index ? value : name)))
  }

  async function onSubmit(event) {
    event.preventDefault()
    setFormError(null)

    const participants = participantNames.map((fullName) => ({
      fullName: fullName === user?.fullName ? user.fullName : fullName,
    }))
    for (const p of participants) {
      if (!p.fullName || !p.fullName.trim()) {
        setFormError('Please enter the full name of every traveller.')
        return
      }
    }

    setBusy(true)
    try {
      const data = await api.createBooking({
        journeyId: Number(id),
        travellersCount: travellers,
        participants: participants.map((p) => ({ fullName: p.fullName.trim() })),
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

            <form onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="book-travellers">Number of travellers</label>
                <input
                  id="book-travellers"
                  type="number"
                  min="1"
                  max={Math.min(20, journey.capacity)}
                  required
                  value={travellers}
                  onChange={(e) => setTravellerCount(e.target.value)}
                />
                <span className="hint">Journey capacity: {journey.capacity} travellers in total.</span>
              </div>

              <h2 className="sub-title">Traveller names</h2>
              {journey.isGroup ? (
                <p className="hint mb-16">
                  This is an organized <strong>group journey</strong> — every participant is listed on
                  the booking.
                </p>
              ) : null}
              {participantNames.map((name, i) => (
                <div className="field" key={i}>
                  <label htmlFor={`participant-${i}`}>Traveller {i + 1}</label>
                  <input
                    id={`participant-${i}`}
                    type="text"
                    required
                    maxLength={200}
                    value={name}
                    onChange={(e) => setParticipantName(i, e.target.value)}
                  />
                </div>
              ))}

              <button type="submit" className="btn btn-primary" disabled={busy}>
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
