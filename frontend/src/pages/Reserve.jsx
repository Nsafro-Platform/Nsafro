import { useEffect, useMemo, useState } from 'react'
import { api, formatPrice } from '../api'
import Stepper from './reservation/Stepper'
import TypeStep from './reservation/TypeStep'
import PersonalPreferencesStep from './reservation/PersonalSteps'
import TransportStep from './reservation/TransportStep'
import { GroupExperienceStep, GroupJourneyStep, ParticipantsStep } from './reservation/GroupSteps'
import { CustomPartyStep, CustomPlanStep } from './reservation/CustomSteps'
import { PaymentStep, ReviewStep } from './reservation/SummarySteps'
import { PanelSkeleton } from '../components/Loading'
import {
  buildCreatePayload,
  buildPayload,
  initialReservation,
  journeyById,
  stepsFor,
  summaryRows,
  validateStep,
} from './reservation/state'
import { useQuote } from './reservation/useQuote'

// Multi-flow reservation wizard (PERSONAL / GROUP / CUSTOM). Form state lives here
// and survives backward/forward navigation; every price shown comes from the
// server quote, never from a value calculated in the browser.
export default function Reserve() {
  const [catalog, setCatalog] = useState(null)
  const [catalogError, setCatalogError] = useState(null)

  const [state, setState] = useState(initialReservation)
  const [stepIndex, setStepIndex] = useState(0)
  const [maxReached, setMaxReached] = useState(0)
  const [stepError, setStepError] = useState(null)

  // Reservation created for the payment gateway, tagged with the configuration it
  // was priced from so editing the configuration invalidates it.
  const [created, setCreated] = useState(null)
  const [payBusy, setPayBusy] = useState(false)
  const [payError, setPayError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .reservationCatalog()
      .then((data) => {
        if (!cancelled) setCatalog(data)
      })
      .catch((err) => {
        if (!cancelled) setCatalogError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const steps = stepsFor(state.type)
  const step = steps[Math.min(stepIndex, steps.length - 1)]
  const payload = useMemo(() => buildPayload(state), [state])
  const payloadKey = payload ? JSON.stringify(payload) : null
  const { quote, error: quoteError, loading: quoteLoading } = useQuote(payload)
  const reservation = created && created.key === payloadKey ? created.reservation : null
  const journey = journeyById(catalog, state.journeyId)

  function update(patch) {
    setState((prev) => ({ ...prev, ...patch }))
  }

  function selectType(type) {
    // Re-picking the same type keeps the answers already given for this flow.
    setState((prev) => (prev.type === type ? prev : { ...initialReservation(), type }))
    setStepError(null)
    setPayError(null)
    setStepIndex(1)
    setMaxReached((prev) => Math.max(prev, 1))
  }

  function goTo(index) {
    setStepError(null)
    setPayError(null)
    setStepIndex(index)
    setMaxReached((prev) => Math.max(prev, index))
  }

  function goNext() {
    const error = validateStep(step.id, state, catalog)
    if (error) {
      setStepError(error)
      return
    }
    if (step.id === 'review' && !quote) {
      setStepError(quoteError || 'The price is still being calculated — one moment.')
      return
    }
    goTo(Math.min(stepIndex + 1, steps.length - 1))
  }

  function goBack() {
    setStepError(null)
    setPayError(null)
    setStepIndex((index) => Math.max(index - 1, 0))
  }

  async function submitPayment(simulate) {
    setPayError(null)
    const createPayload = buildCreatePayload(state)
    if (!createPayload) {
      setPayError('Complete the reservation details before paying.')
      return
    }
    setPayBusy(true)
    try {
      let target = reservation
      if (!target) {
        const data = await api.createReservation(createPayload)
        target = data.reservation
        setCreated({ key: payloadKey, reservation: target })
      }
      const paid = await api.payReservation(target.id, simulate)
      setCreated({ key: payloadKey, reservation: paid.reservation })
    } catch (err) {
      setPayError(err.message)
      // 409 means our local copy is stale (already paid or cancelled): reload the truth.
      if (err.status === 409 && reservation) {
        api
          .reservation(reservation.id)
          .then((data) => setCreated({ key: payloadKey, reservation: data.reservation }))
          .catch(() => {})
      }
    } finally {
      setPayBusy(false)
    }
  }

  function restart() {
    setState(initialReservation())
    setCreated(null)
    setPayError(null)
    setStepError(null)
    setStepIndex(0)
    setMaxReached(0)
  }

  if (catalogError) {
    return (
      <div className="container">
        <p className="alert alert-error">{catalogError}</p>
      </div>
    )
  }
  if (!catalog) {
    return (
      <section className="section">
        <div className="container narrow">
          <PanelSkeleton lines={6} label="Loading reservation options" />
        </div>
      </section>
    )
  }

  const asideRows = summaryRows(state, catalog)

  function renderStep() {
    switch (step.id) {
      case 'type':
        return <TypeStep state={state} onSelect={selectType} />
      case 'preferences':
        return <PersonalPreferencesStep state={state} catalog={catalog} update={update} />
      case 'transport':
        return (
          <TransportStep
            state={state}
            catalog={catalog}
            update={update}
            custom={state.type === 'CUSTOM'}
          />
        )
      case 'journey':
        return <GroupJourneyStep state={state} catalog={catalog} update={update} />
      case 'experience':
        return <GroupExperienceStep journey={journey} travellers={state.travellers} />
      case 'participants':
        return <ParticipantsStep state={state} journey={journey} update={update} />
      case 'plan':
        return <CustomPlanStep state={state} catalog={catalog} update={update} />
      case 'party':
        return <CustomPartyStep state={state} catalog={catalog} update={update} />
      case 'review':
        return (
          <ReviewStep
            state={state}
            catalog={catalog}
            quote={quote}
            quoteError={quoteError}
            quoteLoading={quoteLoading}
          />
        )
      case 'payment':
        return (
          <PaymentStep
            state={state}
            catalog={catalog}
            quote={quote}
            quoteLoading={quoteLoading}
            reservation={reservation}
            busy={payBusy}
            error={payError}
            onPay={submitPayment}
            onRestart={restart}
            onSelectMethod={(id) => update({ paymentMethod: id })}
          />
        )
      default:
        return <p className="empty-state">This step is not available.</p>
    }
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">Reserve your trip</h1>
        <p className="page-sub">
          Pick a reservation type, complete the steps and check out through the simulated payment
          gateway. No real charge is ever made.
        </p>

        <Stepper steps={steps} currentIndex={stepIndex} maxReached={maxReached} onJump={goTo} />

        <div className="detail-grid">
          <div>
            {stepError && <p className="alert alert-error">{stepError}</p>}
            {renderStep()}

            {step.id !== 'payment' && (
              <div className="wz-nav">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={goBack}
                  disabled={stepIndex === 0}
                >
                  ← Back
                </button>
                <button type="button" className="btn btn-primary" onClick={goNext}>
                  Continue
                </button>
              </div>
            )}
          </div>

          <aside className="booking-card" aria-label="Reservation summary">
            <div className="price-line">
              {quote?.pricing ? formatPrice(quote.pricing.total) : '—'}
            </div>
            <p className="page-sub">
              {quote?.pricing ? 'Current total (server-calculated)' : 'Complete the details for a price'}
            </p>
            {asideRows.length > 0 && (
              <ul className="info-list">
                {asideRows.map((row) => (
                  <li key={row.label}>
                    <strong>{row.label}</strong>
                    <span>{row.value}</span>
                  </li>
                ))}
              </ul>
            )}
            {quoteLoading && <p className="hint">Updating price…</p>}
            {quoteError && <p className="hint">{quoteError}</p>}
            <p className="hint mt-16">
              Amounts are recalculated on the server from the offer and option prices stored in the
              database. Checkout is a simulation only — no real charge is made.
            </p>
          </aside>
        </div>
      </div>
    </section>
  )
}
