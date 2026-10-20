import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, formatDate, formatPrice } from '../api'
import { useAuth } from '../auth'
import MediaGallery from '../components/MediaGallery'
import { JourneyDetailSkeleton } from '../components/Loading'

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
  if (error) {
    return (
      <div className="container">
        <p className="alert alert-error">{error}</p>
      </div>
    )
  }
  if (!journey) {
    return (
      <section className="section">
        <div className="container">
          <JourneyDetailSkeleton />
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container">
        <p className="page-sub">
          <Link to="/journeys">← Back to journeys</Link>
        </p>
        <div className="detail-grid">
          <article>
            <MediaGallery
              images={journey.images}
              title={journey.title}
              destination={journey.destination}
              fallbackIndex={journey.id}
            />
            <div className="badge-row">
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
            <p className="price-note">per traveller</p>
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
              {typeof journey.remainingSeats === 'number' && (
                <li>
                  <strong>Availability</strong>
                  <span>
                    {journey.remainingSeats === 0
                      ? 'Fully booked'
                      : `${journey.remainingSeats} of ${journey.capacity} seats left`}
                  </span>
                </li>
              )}
            </ul>
            {journey.remainingSeats === 0 ? (
              <p className="alert alert-error mt-24">
                This journey is fully booked — no seats left for this departure.
              </p>
            ) : user ? (
              <Link to={`/journeys/${journey.id}/book`} className="btn btn-primary btn-block mt-24">
                Book this journey
              </Link>
            ) : (
              <Link to="/login" className="btn btn-purple btn-block mt-24">
                Sign in to book
              </Link>
            )}
            <p className="hint mt-12">
              Payment checkout is a simulation — no real charge is made.
            </p>
          </aside>
        </div>
      </div>
    </section>
  )
}
