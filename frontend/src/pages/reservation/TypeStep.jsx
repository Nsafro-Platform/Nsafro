import { RESERVATION_TYPE_OPTIONS } from './state'
import { OptionCard, StepPanel } from './shared'

export default function TypeStep({ state, onSelect }) {
  return (
    <StepPanel
      title="What do you want to reserve?"
      description="Pick a reservation type. Every flow ends at the same simulated payment gateway."
    >
      <div className="wz-grid">
        {RESERVATION_TYPE_OPTIONS.map((option) => (
          <OptionCard
            key={option.id}
            selected={state.type === option.id}
            onClick={() => onSelect(option.id)}
            title={option.title}
            badge={option.badge}
            description={option.text}
            meta={option.flow}
          />
        ))}
      </div>
    </StepPanel>
  )
}
