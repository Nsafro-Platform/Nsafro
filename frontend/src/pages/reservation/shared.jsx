import { formatPrice } from '../../api'

// Small shared pieces for the reservation wizard. The card treatment (white card
// on a soft track, hairline border, pill status) follows reservation.png.

export function OptionCard({ selected, onClick, title, badge, meta, description, price, children }) {
  return (
    <button
      type="button"
      className={`wz-option${selected ? ' selected' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="wz-option-head">
        <span className="wz-option-title">{title}</span>
        {badge && <span className="badge gray">{badge}</span>}
      </span>
      {description && <span className="wz-option-text">{description}</span>}
      {meta && <span className="wz-option-meta">{meta}</span>}
      {price !== undefined && price !== null && (
        <span className="wz-option-price">{formatPrice(price)}</span>
      )}
      {children}
    </button>
  )
}

export function StepPanel({ title, description, children }) {
  return (
    <section className="wz-panel" aria-label={title}>
      <h2 className="wz-panel-title">{title}</h2>
      {description && <p className="wz-panel-text">{description}</p>}
      {children}
    </section>
  )
}
