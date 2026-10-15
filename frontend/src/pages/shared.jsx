import { Link } from 'react-router-dom'
import { formatDate, formatPrice } from '../api'

// Shared journey-card pieces used by Home and the catalogue page.

export const GOLD_THUMB = 'linear-gradient(120deg, #f7c04a, #f1a501)'
export const PURPLE_THUMB = 'linear-gradient(120deg, #747def, #5e3be1)'
export const CORAL_THUMB = 'linear-gradient(120deg, #ff946d, #ff7d68)'

export function thumbStyle(index) {
  return [GOLD_THUMB, PURPLE_THUMB, CORAL_THUMB][index % 3]
}

// Journeys render their public imageUrl when available (demo seed uses
// Wikimedia Commons destination photos); new/admin-added offers without artwork
// fall back to a neutral tinted tile instead of invented stock imagery.
export function JourneyCard({ journey, index = 0 }) {
  return (
    <Link to={`/journeys/${journey.id}`} className="journey-card">
      <div className="thumb" style={journey.imageUrl ? undefined : { background: thumbStyle(index) }}>
        {journey.imageUrl ? (
          <img src={journey.imageUrl} alt={journey.title} loading="lazy" />
        ) : (
          (journey.destination || journey.title)[0]
        )}
      </div>
      <div>
        <div className="meta">
          <h3>{journey.title}</h3>
          <span className={`badge ${journey.isGroup ? 'blue' : 'green'}`}>
            {journey.isGroup ? 'Group Journey' : 'Individual'}
          </span>
        </div>
        <div className="meta">
          <span>{journey.destination}</span>
          <span className="price">{formatPrice(journey.price)}</span>
        </div>
        <div className="meta">
          <span>
            {formatDate(journey.startDate)} · {journey.durationDays} days
          </span>
        </div>
      </div>
    </Link>
  )
}
