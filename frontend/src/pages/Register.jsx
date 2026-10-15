import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await register(email, password, fullName)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section">
      <div className="container">
        <form className="form-card" onSubmit={onSubmit}>
          <h1>Create your account</h1>
          <p className="lead">Passwords are stored salted and hashed on the backend.</p>
          {error && <p className="alert alert-error">{error}</p>}
          <div className="field">
            <label htmlFor="reg-name">Full name</label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              required
              maxLength={200}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={100}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="hint">8–100 characters.</span>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
          <p className="swap">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </section>
  )
}
