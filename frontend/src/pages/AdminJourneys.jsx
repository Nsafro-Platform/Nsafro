import { useEffect, useState } from 'react'
import { api } from '../api'

const INITIAL = {
  title: '', summary: '', description: '', destination: '', start_date: '', end_date: '',
  price: '0.00', capacity: 10, transport: '', accommodation: '', image_url: '',
  is_group: false, program: '', status: 'draft',
}

export default function AdminJourneys() {
  const [journeys, setJourneys] = useState([])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState(INITIAL)
  const [editingId, setEditingId] = useState(null)

  async function load() {
    try {
      // load all (admin can see all with our API; journeys endpoint respects admin)
      const data = await api.journeys({ limit: 100 })
      setJourneys(data.journeys)
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => { load() }, [])

  function setField(k, v) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        capacity: Number(form.capacity),
        is_group: !!form.is_group,
      }
      if (editingId) {
        await api.adminUpdateJourney(editingId, payload)
      } else {
        await api.adminCreateJourney(payload)
      }
      setForm(INITIAL)
      setEditingId(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function edit(j) {
    setEditingId(j.id)
    setForm({
      title: j.title || '',
      summary: j.summary || '',
      description: j.description || '',
      destination: j.destination || '',
      start_date: j.startDate || '',
      end_date: j.endDate || '',
      price: String(j.price || '0.00'),
      capacity: j.capacity || 10,
      transport: j.transport || '',
      accommodation: j.accommodation || '',
      image_url: j.imageUrl || '',
      is_group: !!j.isGroup,
      program: j.program || '',
      status: j.status || 'draft',
    })
  }

  async function del(id) {
    if (!confirm('Archive this journey?')) return
    setBusy(true)
    try {
      await api.adminDeleteJourney(id)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section">
      <div className="container">
        <h1>Journeys</h1>
        {error && <p className="alert alert-error">{error}</p>}
        <form onSubmit={save} className="card" style={{ marginTop: '1rem' }}>
          <h3>{editingId ? `Edit Journey #${editingId}` : 'Add Journey'}</h3>
          <div className="form-grid">
            <input placeholder="Title" value={form.title} onChange={e => setField('title', e.target.value)} required />
            <input placeholder="Destination" value={form.destination} onChange={e => setField('destination', e.target.value)} required />
            <input placeholder="Summary" value={form.summary} onChange={e => setField('summary', e.target.value)} />
            <input placeholder="Image URL" value={form.image_url} onChange={e => setField('image_url', e.target.value)} />
            <input placeholder="Start Date (YYYY-MM-DD)" value={form.start_date} onChange={e => setField('start_date', e.target.value)} required />
            <input placeholder="End Date (YYYY-MM-DD)" value={form.end_date} onChange={e => setField('end_date', e.target.value)} required />
            <input placeholder="Price" type="number" step="0.01" value={form.price} onChange={e => setField('price', e.target.value)} required />
            <input placeholder="Capacity" type="number" value={form.capacity} onChange={e => setField('capacity', e.target.value)} required />
            <input placeholder="Transport" value={form.transport} onChange={e => setField('transport', e.target.value)} />
            <input placeholder="Accommodation" value={form.accommodation} onChange={e => setField('accommodation', e.target.value)} />
          </div>
          <textarea placeholder="Description" value={form.description} onChange={e => setField('description', e.target.value)} style={{ marginTop: 10 }} />
          <textarea placeholder="Program" value={form.program} onChange={e => setField('program', e.target.value)} style={{ marginTop: 10 }} />
          <div className="form-row">
            <label><input type="checkbox" checked={form.is_group} onChange={e => setField('is_group', e.target.checked)} /> Group journey</label>
            <select value={form.status} onChange={e => setField('status', e.target.value)}>
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
            <button disabled={busy} className="btn btn-primary">{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button type="button" className="btn btn-outline" onClick={() => { setEditingId(null); setForm(INITIAL) }}>Cancel</button>}
          </div>
        </form>
        <div style={{ marginTop: '1rem' }}>
          {journeys.map(j => (
            <div key={j.id} className="card" style={{ marginBottom: 12 }}>
              <p style={{ margin: '0 0 10px' }}>
                <strong>{j.title}</strong> ({j.destination}) - {j.status} - MAD {j.price}
              </p>
              <div className="form-row" style={{ marginTop: 0 }}>
                <button disabled={busy} className="btn btn-outline" onClick={() => edit(j)}>Edit</button>
                <button disabled={busy} className="btn btn-outline" onClick={() => del(j.id)}>Archive</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
