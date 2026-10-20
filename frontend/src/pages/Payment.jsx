import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { api, formatDate, formatPrice } from '../api'
import { PanelSkeleton } from '../components/Loading'

function statusBadge(record) {
  if (record.paymentStatus === 'paid') return <span className="badge green">Paid · confirmed</span>
  if (record.paymentStatus === 'failed') return <span className="badge red">Payment failed</span>
  return <span className="badge yellow">Unpaid · pending</span>
}

// The wizard's reservation shape differs from a booking: the total lives in
// pricing and the journey info (when any) is snapshotted in selectedOptions.
// Normalize it so the rest of the page can render both kinds the same way.
function normalizeReservation(reservation) {
  const options = reservation.selectedOptions || {}
  return {
    ...reservation,
    totalPrice: reservation.pricing?.total ?? reservation.totalPrice,
    journey: options.journey || null,
    destinations: options.destinations || [],
    participants: reservation.participants || [],
  }
}

export default function Payment() {
  const { id } = useParams()
  // URLs decide the kind: /reservations/:id/pay pays wizard reservations,
  // /bookings/:id/pay pays classic bookings.
  const { pathname } = useLocation()
  const isReservation = pathname.startsWith('/reservations/')

  const [record, setRecord] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [notAllowed, setNotAllowed] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [busy, setBusy] = useState(false)

  // Stable loader that also tags which record kind came back, so callers can
  // normalize without re-reading the URL.
  const loadRecord = useCallback(
    () =>
      (isReservation ? api.reservation(id) : api.booking(id)).then((result) => ({
        kind: isReservation ? 'reservation' : 'booking',
        result,
      })),
    [id, isReservation]
  )

  // beforeunload guard: the payment is not done yet, warn only while the page is
  // "locked in" - users cannot navigate away accidentally.
  useEffect(() => {
    let cancelled = false
    loadRecord()
      .then(({ kind, result }) => {
        if (cancelled) return
        setRecord(kind === 'reservation' ? normalizeReservation(result.reservation) : result.booking)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.status === 403 || err.status === 404) setNotAllowed(true)
        else setLoadError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [loadRecord])

  async function attemptPay(simulate) {
    setActionError(null)
    setBusy(true)
    try {
      await (isReservation ? api.payReservation(id, simulate) : api.pay(id, simulate))
      // The pay response returns minimal fields; reload the full record so the
      // confirmation shows the journey title and participant list.
      const { kind, result } = await loadRecord()
      setRecord(kind === 'reservation' ? normalizeReservation(result.reservation) : result.booking)
    } catch (err) {
      setActionError(err.message)
      if (err.status === 409) {
        // Already paid (or cancelled) — refresh the true state.
        loadRecord()
          .then(({ kind, result }) =>
            setRecord(kind === 'reservation' ? normalizeReservation(result.reservation) : result.booking)
          )
          .catch(() => setActionError(err.message))
      }
    } finally {
      setBusy(false)
    }
  }

  function destinationText(item) {
    return item.journey?.title || item.destinations?.join(' · ')
  }

  if (notAllowed) {
    return (
      <div className="container">
        <p className="empty-state">
          This booking does not exist under your account.{' '}
          <Link to="/bookings">View your bookings</Link>
        </p>
      </div>
    )
  }
  if (loadError) {
    return (
      <div className="container">
        <p className="alert alert-error">{loadError}</p>
      </div>
    )
  }
  if (!record) {
    return (
      <section className="section">
        <div className="container narrow">
          <PanelSkeleton lines={5} label="Loading booking" />
        </div>
      </section>
    )
  }

  const paid = record.paymentStatus === 'paid'
  const failed = record.paymentStatus === 'failed'

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">Payment</h1>
        <p className="page-sub">Booking {record.reference} · {statusBadge(record)}</p>

        <p className="notice-simulated">
          ⚠ Simulation only — this demo never collects card data and no real charge is made.
        </p>

        {actionError && <p className="alert alert-error">{actionError}</p>}

        {paid && (
          <div className="confirm-box">
            <p className="subheading">Booking confirmed</p>
            <h1>Your booking is confirmed 🎉</h1>
            <p className="lead">Your booking reference — keep this for any support requests:</p>
            <div className="ref">{record.reference}</div>
            <ul className="info-list text-left">
              <li>
                <strong>Journey</strong>
                <span>{destinationText(record)}</span>
              </li>
              <li>
                <strong>Departure</strong>
                <span>{formatDate(record.journey?.startDate)}</span>
              </li>
              <li>
                <strong>Travellers</strong>
                <span>{record.travellersCount}</span>
              </li>
              <li>
                <strong>Total paid</strong>
                <span>{formatPrice(record.totalPrice)}</span>
              </li>
              <li>
                <strong>Payment</strong>
                <span>Simulated success — no real money moved</span>
              </li>
            </ul>
            {record.participants && record.participants.length > 0 && (
              <ul className="participants-list">
                {record.participants.map((p) => (
                  <li key={p.id}>
                    <span>{p.fullName}</span>
                    <span>{p.status}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/bookings" className="btn btn-primary mt-24">
              Go to my bookings
            </Link>
          </div>
        )}

        {!paid && (
          <div className="booking-card narrow">
            <ul className="info-list">
              <li>
                <strong>Booking</strong>
                <span className="ref">{record.reference}</span>
              </li>
              <li>
                <strong>Journey</strong>
                <span>{destinationText(record)}</span>
              </li>
              <li>
                <strong>Travellers</strong>
                <span>{record.travellersCount}</span>
              </li>
              <li>
                <strong>Amount</strong>
                <span>{formatPrice(record.totalPrice)}</span>
              </li>
            </ul>

            {failed && (
              <p className="alert alert-error mt-16">
                The last simulated payment attempt failed. You can retry below.
              </p>
            )}

            <div className="actions-row">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => attemptPay('success')}
                disabled={busy}
              >
                {busy ? 'Processing…' : 'Pay (simulated success)'}
              </button>
              <button
                type="button"
                className="btn btn-danger-outline"
                onClick={() => attemptPay('failure')}
                disabled={busy}
                title="Demo switch to see the failure path"
              >
                Simulate declined payment
              </button>
              <Link to="/bookings" className="btn btn-outline">
                My bookings
              </Link>
            </div>
            <p className="hint mt-16">
              Repeated attempts cannot double-charge: the backend guarantees at most one
              successful payment per booking.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
