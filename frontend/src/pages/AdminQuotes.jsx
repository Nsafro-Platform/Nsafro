import { useEffect, useState } from 'react'
import { api } from '../api'

const STATUSES = ['submitted', 'in_review', 'quoted', 'rejected']

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState([])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notes, setNotes] = useState({})

  async function load() {
    try {
      const data = await api.adminQuoteRequests()
      setQuotes(data.quoteRequests)
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => { load() }, [])

  async function update(id) {
    setBusy(true)
    try {
      await api.adminUpdateQuoteRequest(id, { status: notes[id]?.status || undefined, agentNote: notes[id]?.agentNote })
      await load()
      setNotes(n => ({ ...n, [id]: {} }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section">
      <div className="container">
        <h1>Quote Requests</h1>
        {error && <p className="alert alert-error">{error}</p>}
        <div style={{ marginTop: '1rem' }}>
          {quotes.map(q => (
            <div key={q.id} className="card" style={{ marginBottom: '1rem' }}>
              <h3>{q.itineraryTitle}</h3>
              <p>User: {q.user.email} | Status: {q.status} | Indicated: {q.indicatedTotal}</p>
              <textarea
                placeholder="Agent note..."
                value={notes[q.id]?.agentNote || q.agentNote || ''}
                onChange={(e) => setNotes(n => ({ ...n, [q.id]: { ...n[q.id], agentNote: e.target.value } }))}
                style={{ width: '100%', minHeight: 80 }}
              />
              <div style={{ marginTop: 10 }}>
                <select value={notes[q.id]?.status || q.status} onChange={(e) => setNotes(n => ({ ...n, [q.id]: { ...n[q.id], status: e.target.value } }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button disabled={busy} className="btn btn-primary" style={{ marginLeft: 10 }} onClick={() => update(q.id)}>Update</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
