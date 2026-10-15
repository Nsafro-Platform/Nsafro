import { optionsByCategory } from './state'
import { OptionCard, StepPanel } from './shared'

// Transport mode selection, shared by the Personal (step 3) and Custom (step 4)
// flows. Options come from the journey_options catalogue the admin manages.
export default function TransportStep({ state, catalog, update, custom }) {
  const transports = optionsByCategory(catalog, 'transport')
  const unit = custom ? 'member' : 'traveller'

  return (
    <StepPanel
      title={custom ? 'Custom transport' : 'Transport mode'}
      description={`Pick the means of transport for this trip. Each price is per ${unit}.`}
    >
      <div className="wz-grid">
        {transports.map((option) => (
          <OptionCard
            key={option.id}
            selected={state.transportOptionId === option.id}
            onClick={() => update({ transportOptionId: option.id })}
            title={option.name}
            description={option.description}
            price={option.price}
            meta={`per ${unit}`}
          />
        ))}
      </div>
      {transports.length === 0 && (
        <p className="empty-state">No transport options are published yet.</p>
      )}
    </StepPanel>
  )
}
