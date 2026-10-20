import { formatPrice } from '../../api'
import { PAYMENT_METHODS, summaryRows } from './state'
import { OptionCard, StepPanel } from './shared'

export function PricingBreakdown({ pricing }) {
  if (!pricing) return null
  const lines = pricing.lines || []
  return (
    <div className="wz-pricing">
      {lines.length > 0 && (
        <ul className="wz-lines">
          {lines.map((line, index) => (
            <li key={`${line.label}-${index}`}>
              <span className="wz-line-label">
                <strong>{line.label}</strong>
                {line.detail && <em>{line.detail}</em>}
              </span>
              <span>{formatPrice(line.amount)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="wz-total-row">
        <span>Total</span>
        <span>{formatPrice(pricing.total)}</span>
      </div>
    </div>
  )
}

export function ReviewStep({ state, catalog, quote, quoteError, quoteLoading }) {
  const rows = summaryRows(state, catalog)
  return (
    <StepPanel
      title="Review your reservation"
      description="Check the configuration and the server-calculated price before the payment gateway."
    >
      <ul className="info-list">
        {rows.map((row) => (
          <li key={row.label}>
            <strong>{row.label}</strong>
            <span>{row.value}</span>
          </li>
        ))}
      </ul>

      <h3 className="wz-subtitle">Price breakdown</h3>
      {quoteError && <p className="alert alert-error">{quoteError}</p>}
      {quoteLoading ? <p className="loading">Calculating price…</p> : <PricingBreakdown pricing={quote?.pricing} />}
      <p className="hint">
        Prices are calculated on the server from the offer and option prices stored in the
        database — the browser never sends an amount.
      </p>
    </StepPanel>
  )
}

export function PaymentStep({
  state,
  catalog,
  quote,
  quoteLoading,
  reservation,
  busy,
  error,
  onPay,
  onRestart,
  onSelectMethod,
}) {
  if (reservation?.paymentStatus === 'paid') {
    const rows = summaryRows(state, catalog)
    return (
      <div className="confirm-box">
        <p className="subheading">Reservation confirmed</p>
        <h1>Your reservation is confirmed 🎉</h1>
        <p className="lead">Keep this reference for any support requests:</p>
        <div className="ref">{reservation.reference}</div>
        <ul className="info-list text-left">
          {rows.map((row) => (
            <li key={row.label}>
              <strong>{row.label}</strong>
              <span>{row.value}</span>
            </li>
          ))}
          <li>
            <strong>Total</strong>
            <span>{formatPrice(reservation.pricing?.total ?? quote?.pricing?.total)}</span>
          </li>
          <li>
            <strong>Payment</strong>
            <span>Simulated success — no real money moved</span>
          </li>
        </ul>
        <button type="button" className="btn btn-primary mt-24" onClick={onRestart}>
          Start a new reservation
        </button>
      </div>
    )
  }

  return (
    <StepPanel
      title="Payment gateway"
      description="One gateway for every reservation type. The outcome is simulated end to end."
    >
      <p className="notice-simulated">
        ⚠ Simulation only — no card details are collected or stored, and no real charge is made.
      </p>

      {error && <p className="alert alert-error">{error}</p>}
      {reservation?.paymentStatus === 'failed' && !error && (
        <p className="alert alert-error">
          The last simulated attempt was declined. Your reservation is still held — retry below.
        </p>
      )}

      <h3 className="wz-subtitle">Payment method</h3>
      <div className="wz-grid wz-grid-tight">
        {PAYMENT_METHODS.map((method) => (
          <OptionCard
            key={method.id}
            selected={state.paymentMethod === method.id}
            onClick={() => onSelectMethod(method.id)}
            title={method.title}
            description={method.text}
          />
        ))}
      </div>
      <p className="hint">
        Choosing a method only records which simulated route you used. No card or wallet details
        are ever entered on this page.
      </p>

      <h3 className="wz-subtitle">Amount due</h3>
      {quoteLoading || !quote?.pricing ? (
        <p className="loading">Calculating price…</p>
      ) : (
        <PricingBreakdown pricing={quote.pricing} />
      )}

      <div className="wz-pay-actions">
        <button type="button" className="btn btn-primary" onClick={() => onPay('success')} disabled={busy}>
          {busy ? 'Processing…' : 'Pay (simulated success)'}
        </button>
        <button
          type="button"
          className="btn btn-danger-outline"
          onClick={() => onPay('failure')}
          disabled={busy}
          title="Demo switch to see the declined path"
        >
          Simulate declined payment
        </button>
      </div>
      <p className="hint">
        Repeated attempts cannot double-charge: the backend allows at most one successful payment
        per reservation.
      </p>
    </StepPanel>
  )
}
