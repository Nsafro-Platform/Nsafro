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
        <div className="card" style={{ marginTop: '1rem' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <select disabled={busy} value={u.role} onChange={(e) => updateRole(u.id, e.target.value)}>
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
