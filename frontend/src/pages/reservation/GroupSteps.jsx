import { formatDate, formatPrice } from '../../api'
import MediaGallery from '../../components/MediaGallery'
import { OptionCard, StepPanel } from './shared'

export function GroupJourneyStep({ state, catalog, update }) {
  const journeys = catalog.journeys.filter((j) => j.isGroup)

  return (
    <StepPanel
      title="Choose a group journey"
      description="Pre-organized departures with a published program, guide and fixed seats."
    >
      <div className="wz-grid">
        {journeys.map((journey) => (
          <OptionCard
            key={journey.id}
            selected={state.journeyId === journey.id}
            onClick={() => update({ journeyId: journey.id })}
            title={journey.title}
            badge={`${journey.remainingSeats} seat(s) left`}
            description={journey.summary}
            meta={`${journey.destination} · ${formatDate(journey.startDate)} · ${journey.durationDays} days`}
            price={journey.price}
          />
        ))}
      </div>
      {journeys.length === 0 && (
        <p className="empty-state">No group journeys are published yet.</p>
      )}
    </StepPanel>
  )
}

export function GroupExperienceStep({ journey, travellers }) {
  if (!journey) return <p className="empty-state">Choose a group journey first.</p>

  return (
    <StepPanel
      title={`Journey experience — ${journey.title}`}
      description="Everything that is included before you choose your seats."
    >
      <MediaGallery
        images={journey.images}
        title={journey.title}
        destination={journey.destination}
        fallbackIndex={journey.id}
      />

      <div className="wz-two-col">
        <ul className="info-list">
          <li>
            <strong>Duration</strong>
            <span>
              {journey.durationDays} days · {formatDate(journey.startDate)} – {formatDate(journey.endDate)}
            </span>
          </li>
          <li>
            <strong>Destination</strong>
            <span>{journey.destination}</span>
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
            <strong>Price</strong>
            <span>{formatPrice(journey.price)} per participant</span>
          </li>
          <li>
            <strong>Remaining seats</strong>
            <span>
              {journey.remainingSeats} of {journey.capacity}
            </span>
          </li>
        </ul>
        <div>
          <h3 className="wz-subtitle">Itinerary & places to visit</h3>
          {journey.program ? (
            <p className="wz-panel-text">{journey.program}</p>
          ) : (
            <p className="wz-panel-text">
              The detailed itinerary is confirmed by the guide after booking. Places visited:{' '}
              {journey.destination}.
            </p>
          )}
          <p className="hint">
            You are selecting {travellers} seat(s); {journey.remainingSeats} are still available.
          </p>
        </div>
      </div>
    </StepPanel>
  )
}

export function ParticipantsStep({ state, journey, update }) {
  const maxSeats = journey ? Math.min(20, journey.remainingSeats) : 20

  function setCount(next) {
    const count = Math.max(1, Math.min(maxSeats, Number(next) || 1))
    update({
      travellers: count,
      participantNames: Array.from({ length: count }, (_, i) => state.participantNames[i] || ''),
    })
  }

  function setName(index, value) {
    update({
      participantNames: state.participantNames.map((name, i) => (i === index ? value : name)),
    })
  }

  return (
    <StepPanel
      title="Participant details"
      description="Choose how many seats you are reserving, then name every participant."
    >
      <div className="field">
        <label htmlFor="wz-seats">Seats</label>
        <input
          id="wz-seats"
          type="number"
          min="1"
          max={maxSeats}
          value={state.travellers}
          onChange={(e) => setCount(e.target.value)}
        />
        <span className="hint">
          {journey
            ? `${journey.remainingSeats} seat(s) left on ${journey.title} (capacity ${journey.capacity}).`
            : 'Select a group journey first.'}
        </span>
      </div>

      <h3 className="wz-subtitle">Participants</h3>
      {state.participantNames.map((name, index) => (
        <div className="field" key={index}>
          <label htmlFor={`wz-participant-${index}`}>Participant {index + 1}</label>
          <input
            id={`wz-participant-${index}`}
            type="text"
            maxLength={200}
            value={name}
            onChange={(e) => setName(index, e.target.value)}
          />
        </div>
      ))}
    </StepPanel>
  )
}
