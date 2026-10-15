import { formatPrice } from '../../api'
import { PARTY_LABELS, optionsByCategory } from './state'
import { OptionCard, StepPanel } from './shared'

export function CustomPlanStep({ state, catalog, update }) {
  const stopovers = optionsByCategory(catalog, 'activity')

  function toggleDestination(destination) {
    update({
      destinations: state.destinations.includes(destination)
        ? state.destinations.filter((d) => d !== destination)
        : [...state.destinations, destination],
    })
  }

  function toggleStopover(id) {
    update({
      stopoverOptionIds: state.stopoverOptionIds.includes(id)
        ? state.stopoverOptionIds.filter((value) => value !== id)
        : [...state.stopoverOptionIds, id],
    })
  }

  return (
    <>
      <StepPanel
        title="Destinations"
        description="Pick up to 5 destinations from the places the platform currently covers."
      >
        <div className="wz-chips">
          {catalog.destinations.map((destination) => {
            const selected = state.destinations.includes(destination)
            return (
              <button
                key={destination}
                type="button"
                className={`wz-chip${selected ? ' selected' : ''}`}
                aria-pressed={selected}
                onClick={() => toggleDestination(destination)}
              >
                {destination}
              </button>
            )
          })}
        </div>
        <p className="hint">{state.destinations.length} of 5 destinations selected.</p>
      </StepPanel>

      <StepPanel
        title="Stopover places to visit"
        description="Optional experiences and visits to include in your itinerary. Priced per member."
      >
        <div className="wz-grid">
          {stopovers.map((option) => (
            <OptionCard
              key={option.id}
              selected={state.stopoverOptionIds.includes(option.id)}
              onClick={() => toggleStopover(option.id)}
              title={option.name}
              description={option.description}
              price={option.price}
              meta="per member"
            />
          ))}
        </div>
        <p className="hint">{state.stopoverOptionIds.length} of 8 stopovers selected.</p>
      </StepPanel>
    </>
  )
}

export function CustomPartyStep({ state, catalog, update }) {
  return (
    <StepPanel
      title="Party size & details"
      description={`Travelling as ${PARTY_LABELS[state.partyType] || state.partyType}? Tell us who is coming.`}
    >
      <div className="wz-grid wz-grid-tight">
        {catalog.partyTypes.map((partyType) => (
          <OptionCard
            key={partyType}
            selected={state.partyType === partyType}
            onClick={() => update({ partyType })}
            title={PARTY_LABELS[partyType] || partyType}
          />
        ))}
      </div>

      <div className="field" style={{ maxWidth: 320 }}>
        <label htmlFor="wz-members">Number of members</label>
        <input
          id="wz-members"
          type="number"
          min="1"
          max="30"
          value={state.members}
          onChange={(e) => update({ members: Math.max(1, Math.min(30, Number(e.target.value) || 1)) })}
        />
        <span className="hint">
          Between 1 and 30 members. Transport and stopovers are priced per member; the
          planning fee ({formatPrice(catalog.pricing.customPlanningFee)}) is charged once.
        </span>
      </div>
    </StepPanel>
  )
}
