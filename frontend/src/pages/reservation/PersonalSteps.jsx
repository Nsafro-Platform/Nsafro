import { OptionCard, StepPanel } from './shared'

// Step 2 of the Personal flow: dynamic scale/degree selection plus the trip
// preferences the spec lists (comfort level, schedule option).
export default function PersonalPreferencesStep({ state, catalog, update }) {
  // Individual offers first — this flow is for individual travellers.
  const journeys = [...catalog.journeys].sort((a, b) => Number(a.isGroup) - Number(b.isGroup))

  return (
    <>
      <StepPanel
        title="Journey & scale"
        description="Choose the journey you are reserving, then your scale/degree. The scale
          changes the per-traveller price."
      >
        <div className="field">
          <label htmlFor="wz-journey">Journey</label>
          <select
            id="wz-journey"
            value={state.journeyId || ''}
            onChange={(e) => update({ journeyId: Number(e.target.value) || null })}
          >
            <option value="">Select a journey…</option>
            {journeys.map((journey) => (
              <option key={journey.id} value={journey.id}>
                {journey.title} — {journey.destination} · {journey.remainingSeats} seat(s) left
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="wz-travellers">Travellers</label>
          <input
            id="wz-travellers"
            type="number"
            min="1"
            max="20"
            value={state.travellers}
            onChange={(e) => update({ travellers: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })}
          />
          <span className="hint">Between 1 and 20 travellers per reservation.</span>
        </div>
      </StepPanel>

      <StepPanel
        title="Scale / degree (Echelle)"
        description="Each level adjusts the journey price by its multiplier."
      >
        <div className="wz-grid wz-grid-tight">
          {catalog.serviceTiers.map((tier) => (
            <OptionCard
              key={tier.id}
              selected={state.tier === tier.id}
              onClick={() => update({ tier: tier.id })}
              title={tier.label}
              badge={`×${tier.multiplier}`}
              description={tier.description}
            />
          ))}
        </div>
      </StepPanel>

      <StepPanel
        title="Trip preferences"
        description="These describe how you want to travel; they do not change the price."
      >
        <div className="wz-two-col">
          <div className="field">
            <label htmlFor="wz-comfort">Comfort level</label>
            <select
              id="wz-comfort"
              value={state.preferences.comfort}
              onChange={(e) => update({ preferences: { ...state.preferences, comfort: e.target.value } })}
            >
              <option value="">No preference</option>
              {catalog.preferences.comfort.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="wz-schedule">Preferred schedule</label>
            <select
              id="wz-schedule"
              value={state.preferences.schedule}
              onChange={(e) => update({ preferences: { ...state.preferences, schedule: e.target.value } })}
            >
              <option value="">No preference</option>
              {catalog.preferences.schedule.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
      </StepPanel>
    </>
  )
}
