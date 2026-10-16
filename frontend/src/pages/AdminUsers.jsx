import { useEffect, useState } from 'react'
import { api } from '../api'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    try {
      const data = await api.adminUsers()
      setUsers(data.users)
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => { load() }, [])

  async function updateRole(id, role) {
    setBusy(true)
    try {
      await api.adminUpdateUserRole(id, role)
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
        <h1>Users</h1>
        {error && <p className="alert alert-error">{error}</p>}
        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table className="bookings">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {/* data-label feeds the stacked card headings shown on phones. */}
              {users.map(u => (
                <tr key={u.id}>
                  <td data-label="Name">{u.fullName}</td>
                  <td data-label="Email">{u.email}</td>
                  <td data-label="Role">{u.role}</td>
                  <td data-label="Actions">
                    <select disabled={busy} value={u.role} onChange={(e) => updateRole(u.id, e.target.value)} aria-label={`Role for ${u.email}`}>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
