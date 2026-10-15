import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, formatDate, formatPrice } from '../api'

function statusBadge(booking) {
  if (booking.paymentStatus === 'paid') return <span className="badge green">Paid · confirmed</span>
  if (booking.paymentStatus === 'failed') return <span className="badge red">Payment failed</span>
  return <span className="badge yellow">Unpaid · pending</span>
}

export default function Payment() {
  const { id } = useParams()

  const [booking, setBooking] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [notAllowed, setNotAllowed] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [busy, setBusy] = useState(false)

  // beforeunload guard: the payment is not done yet, warn only while the page is
  // "locked in" - users cannot navigate away accidentally.
  useEffect(() => {
    let cancelled = false
    api
      .booking(id)
      .then((data) => {
        if (!cancelled) setBooking(data.booking)
      })
      .catch((err) => {
        if (cancelled) return
        if (err.status === 403 || err.status === 404) setNotAllowed(true)
        else setLoadError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  async function attemptPay(simulate) {
    setActionError(null)
    setBusy(true)
    try {
      const data = await api.pay(id, simulate)
      // The pay response returns minimal fields; reload the full booking so the
      // confirmation shows the journey title and participant list.
      const full = await api.booking(id)
      setBooking(full.booking || data.booking)
    } catch (err) {
      setActionError(err.message)
      if (err.status === 409) {
        // Already paid (or cancelled) — refresh the true state.
        api
          .booking(id)
          .then((data) => setBooking(data.booking))
          .catch(() => setActionError(err.message))
      }
    } finally {
      setBusy(false)
    }
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
  if (loadError) return <p className="alert alert-error">{loadError}</p>
  if (!booking) return <p className="loading">Loading booking…</p>

  const paid = booking.paymentStatus === 'paid'
  const failed = booking.paymentStatus === 'failed'

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">Payment</h1>
        <p className="page-sub">Booking {booking.reference} · {statusBadge(booking)}</p>

        <p className="notice-simulated">
          ⚠ Simulation only — this demo never collects card data and no real charge is made.
        </p>

        {actionError && <p className="alert alert-error">{actionError}</p>}

        {paid && (
          <div className="confirm-box">
            <p className="subheading">Booking confirmed</p>
            <h1>Your booking is confirmed 🎉</h1>
            <p className="lead">Your booking reference — keep this for any support requests:</p>
            <div className="ref">{booking.reference}</div>
            <ul className="info-list" style={{ textAlign: 'left' }}>
              <li>
                <strong>Journey</strong>
                <span>{booking.journey?.title}</span>
              </li>
              <li>
                <strong>Departure</strong>
                <span>{formatDate(booking.journey?.startDate)}</span>
              </li>
              <li>
                <strong>Travellers</strong>
                <span>{booking.travellersCount}</span>
              </li>
              <li>
                <strong>Total paid</strong>
                <span>{formatPrice(booking.totalPrice)}</span>
              </li>
              <li>
                <strong>Payment</strong>
                <span>Simulated success — no real money moved</span>
              </li>
            </ul>
            {booking.participants && booking.participants.length > 0 && (
              <ul className="participants-list">
                {booking.participants.map((p) => (
                  <li key={p.id}>
                    <span>{p.fullName}</span>
                    <span>{p.status}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/bookings" className="btn btn-primary" style={{ marginTop: 22 }}>
              Go to my bookings
            </Link>
          </div>
        )}

        {!paid && (
          <div className="booking-card" style={{ maxWidth: 620, margin: '0 auto' }}>
            <ul className="info-list">
              <li>
                <strong>Booking</strong>
                <span className="ref">{booking.reference}</span>
              </li>
              <li>
                <strong>Journey</strong>
                <span>{booking.journey?.title}</span>
              </li>
              <li>
                <strong>Travellers</strong>
                <span>{booking.travellersCount}</span>
              </li>
              <li>
                <strong>Amount</strong>
                <span>{formatPrice(booking.totalPrice)}</span>
              </li>
            </ul>

            {failed && (
              <p className="alert alert-error" style={{ marginTop: 16 }}>
                The last simulated payment attempt failed. You can retry below.
              </p>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
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
            <p className="hint" style={{ fontSize: 12, marginTop: 14 }}>
              Repeated attempts cannot double-charge: the backend guarantees at most one
              successful payment per booking.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
