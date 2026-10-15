// Step progress indicator for the reservation view.
// Visual language taken from reservation.png: navy nodes sitting on a connector
// rail, white step cards over a soft track, and a status pill per step.

function statusOf(index, currentIndex) {
  if (index < currentIndex) return 'completed'
  if (index === currentIndex) return 'in-progress'
  return 'upcoming'
}

export default function Stepper({ steps, currentIndex, maxReached, onJump }) {
  return (
    <section className="wz-steps" aria-label="Reservation progress">
      <h2 className="wz-steps-title">
        Reservation Steps ({steps.length})
      </h2>
      <div className="wz-track">
        <ol className="wz-rail">
          {steps.map((step, index) => {
            const status = statusOf(index, currentIndex)
            const reachable = index <= maxReached
            return (
              <li key={step.id} className={`wz-step ${status}`}>
                <button
                  type="button"
                  className="wz-step-btn"
                  onClick={() => reachable && onJump(index)}
                  disabled={!reachable}
                  aria-current={status === 'in-progress' ? 'step' : undefined}
                >
                  <span className="wz-node" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className="wz-step-name">{step.label}</span>
                  <span className="wz-step-meta">
                    Step {index + 1} of {steps.length}
                  </span>
                  <span className={`badge ${status === 'completed' ? 'green' : status === 'in-progress' ? 'yellow' : 'gray'}`}>
                    {status === 'in-progress' ? 'in progress' : status}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
