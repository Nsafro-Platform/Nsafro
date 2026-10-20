import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import PasswordField from '../components/PasswordField'

export default function Login() {
  const { login, refresh } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [googleClientId, setGoogleClientId] = useState(null)
  const googleDivRef = useRef(null)

  // Discover the Google OAuth client id; when present, load Google's script
  // and render the official button. Absent = the feature stays hidden and
  // local email/password sign-in keeps working.
  useEffect(() => {
    let cancelled = false
    api
      .googleClientId()
      .then((data) => {
        if (!cancelled) setGoogleClientId(data.clientId)
      })
      .catch(() => {
        if (!cancelled) setGoogleClientId(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!googleClientId || !googleDivRef.current) return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true

    script.onload = () => {
      if (!window.google?.accounts?.id || !googleDivRef.current) return
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          setError(null)
          setBusy(true)
          try {
            await api.googleSignIn(response.credential)
            const user = await refresh()
            if (user) navigate(from, { replace: true })
            else setError('Signed in with Google, but the session could not be established.')
          } catch (err) {
            setError(err.message)
          } finally {
            setBusy(false)
          }
        },
      })
      // Google's button needs a pixel width; fit it to the card so it never
      // overflows on phones, while keeping the 340px desktop size.
      const available = googleDivRef.current.clientWidth || 340
      window.google.accounts.id.renderButton(googleDivRef.current, {
        theme: 'outline',
        size: 'large',
        width: Math.min(340, Math.max(200, Math.floor(available))),
        text: 'continue_with',
      })
    }
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [googleClientId, from, navigate, refresh])

  async function onSubmit(event) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const userData = await login(email, password)
      // While the Google button is being wired up with your client ID, this
      // stays the primary path.
      if (userData) navigate(from, { replace: true })
      else setError('Signed in, but the session could not be established.')
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
          <h1>Sign in</h1>
          <p className="lead">Access your bookings, drafts and profile.</p>
          {error && <p className="alert alert-error">{error}</p>}
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <PasswordField
              id="login-password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          {googleClientId && (
            <>
              <p className="or-divider">or</p>
              <div ref={googleDivRef} className="google-slot" />
            </>
          )}
          <p className="swap">
            No account yet? <Link to="/register">Create one</Link>
          </p>
        </form>
      </div>
    </section>
  )
}
