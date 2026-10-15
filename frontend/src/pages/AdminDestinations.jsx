import { useEffect, useState } from 'react'
import { api } from '../api'

export default function AdminDestinations() {
  const [destinations, setDestinations] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    api.adminDestinations()
      .then(data => setDestinations(data.destinations))
      .catch(err => setError(err.message))
  }, [])

  return (
    <section className="section">
      <div className="container">
        <h1>Destinations</h1>
        {error && <p className="alert alert-error">{error}</p>}
        <div className="card" style={{ marginTop: '1rem' }}>
          <ul>
            {destinations.map((d, i) => (
              <li key={i}>{d.destination} ({d.journey_count} journeys)</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
