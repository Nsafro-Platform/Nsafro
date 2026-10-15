import { useEffect, useState } from 'react'
import { api } from '../api'

const CATEGORIES = ['transport', 'accommodation', 'activity']

export default function AdminOptions() {
  const [options, setOptions] = useState([])
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ category: 'transport', name: '', description: '', price: '0.00' })
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      const data = await api.adminOptions()
      setOptions(data.options)
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => { load() }, [])

  async function create(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.adminCreateOption(form)
      setForm({ category: 'transport', name: '', description: '', price: '0.00' })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function del(id) {
    if (!confirm('Delete this option?')) return
    setBusy(true)
    try {
      await api.adminDeleteOption(id)
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
        <h1>Options</h1>
        {error && <p className="alert alert-error">{error}</p>}
        <form onSubmit={create} className="card" style={{ marginTop: '1rem' }}>
          <h3>Add Option</h3>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <input placeholder="Price" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
          <button disabled={busy} className="btn btn-primary">Add</button>
        </form>
        <div style={{ marginTop: '1rem' }}>
          {options.map(o => (
            <div key={o.id} className="card" style={{ marginBottom: 10 }}>
              <strong>{o.name}</strong> ({o.category}) - MAD {o.price}
              <button disabled={busy} className="btn btn-outline" style={{ marginLeft: 10 }} onClick={() => del(o.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
