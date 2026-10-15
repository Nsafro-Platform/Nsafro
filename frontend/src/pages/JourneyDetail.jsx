import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, formatDate, formatPrice } from '../api'
import { useAuth } from '../auth'
import { thumbStyle } from './shared'

export default function JourneyDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [journey, setJourney] = useState(null)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .journey(id)
      .then((data) => {
        if (!cancelled) setJourney(data.journey)
      })
      .catch((err) => {
        if (!cancelled) {
          if (err.status === 404) setNotFound(true)
          else setError(err.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (notFound) {
    return (
      <div className="container">
        <p className="empty-state">
          Journey not found. <Link to="/journeys">Back to the catalogue</Link>
        </p>
      </div>
    )
  }
  if (error) return <p className="alert alert-error">{error}</p>
  if (!journey) return <p className="loading">Loading journey…</p>

  return (
    <section className="section">
      <div className="container">
        <p className="page-sub">
          <Link to="/journeys">← Back to journeys</Link>
        </p>
        <div className="detail-grid">
          <article>
            <div
              className="detail-hero"
              style={journey.imageUrl ? undefined : { background: thumbStyle(journey.id) }}
            >
              {journey.imageUrl ? (
                <img src={journey.imageUrl} alt={journey.title} />
              ) : (
                (journey.destination || journey.title)[0]
              )}
            </div>
            <div className="meta" style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <span className={`badge ${journey.isGroup ? 'blue' : 'green'}`}>
                {journey.isGroup ? 'Group Journey' : 'Individual Journey'}
              </span>
              <span className="badge gray">
                {formatDate(journey.startDate)} – {formatDate(journey.endDate)}
              </span>
            </div>
            <h1 className="page-title">{journey.title}</h1>
            <p className="page-sub">{journey.summary}</p>
            <div className="prose">
              <h2>About this journey</h2>
              <p>{journey.description}</p>
            </div>
            {journey.program && (
              <div className="prose">
                <h2>Program</h2>
                <p>{journey.program}</p>
              </div>
            )}
          </article>

          <aside className="booking-card" aria-label="Booking summary">
            <div className="price-line">{formatPrice(journey.price)}</div>
            <p className="page-sub">per traveller</p>
            <ul className="info-list">
              <li>
                <strong>Destination</strong>
                <span>{journey.destination}</span>
              </li>
              <li>
                <strong>Duration</strong>
                <span>{journey.durationDays} days</span>
              </li>
              <li>
                <strong>Departure</strong>
                <span>{formatDate(journey.startDate)}</span>
              </li>
              <li>
                <strong>Return</strong>
                <span>{formatDate(journey.endDate)}</span>
              </li>
              {journey.transport && (
                <li>
                  <strong>Transport</strong>
                  <span>{journey.transport}</span>
                </li>
              )}
              {journey.accommodation && (
                <li>
                  <strong>Accommodation</strong>
                  <span>{journey.accommodation}</span>
                </li>
              )}
              <li>
                <strong>Capacity</strong>
                <span>{journey.capacity} travellers</span>
              </li>
            </ul>
            {user ? (
              <Link to={`/journeys/${journey.id}/book`} className="btn btn-primary" style={{ width: '100%', marginTop: 18 }}>
                Book this journey
              </Link>
            ) : (
              <Link to="/login" className="btn btn-purple" style={{ width: '100%', marginTop: 18 }}>
                Sign in to book
              </Link>
            )}
            <p className="hint" style={{ fontSize: 12, marginTop: 10 }}>
              Payment checkout is a simulation — no real charge is made.
            </p>
          </aside>
        </div>
      </div>
    </section>
  )
}
