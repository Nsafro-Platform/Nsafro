import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { JourneyCard } from './shared'
import homePageArt from '../assets/home_page.svg'

const STEPS = [
  {
    title: 'Choose Destination',
    text: 'Browse published journey offers, search by destination, date window and price, then open the offer that fits your plans.',
  },
  {
    title: 'Make Payment',
    text: 'Checkout with a clearly labelled simulated payment (demo only — no real charge is made) and receive your booking reference.',
  },
  {
    title: 'Reach Airport on Selected Date',
    text: 'Your booking history keeps every confirmation and participant list so you can pick up exactly where you left off.',
  },
]

export default function Home() {
  const [journeys, setJourneys] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .journeys({ limit: 6, sort: 'price_asc' })
      .then((data) => setJourneys(data.journeys))
      .catch((err) => setError(err.message))
  }, [])
  // Latest offers show first; the catalogue page holds the full list.

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="subheading">Best Destinations around the world</p>
            <h1>Travel, enjoy and live a new and full life for you</h1>
            <p>
              Discover curated journeys, book with a simulated checkout and keep every confirmation
              in one place. Demo platform — no real charges are ever made.
            </p>
            <Link to="/journeys" className="btn btn-primary">
              Explore journeys
            </Link>
          </div>
          <div className="hero-art">
            <img src={homePageArt} alt="Nsafro travel destinations" />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="how-it-works">
        <div className="container">
          <div className="section-head">
            <p className="subheading">Easy and Fast</p>
            <h2 id="how-it-works">Book your next trip in 3 easy steps</h2>
          </div>
          <div className="steps">
            {STEPS.map((step, i) => (
              <article className="step" key={step.title}>
                <span className="step-number">Step 0{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="offers">
        <div className="container">
          <div className="section-head">
            <p className="subheading">Top Destinations</p>
            <h2 id="offers">Latest journey offers</h2>
          </div>
          {error && <p className="alert alert-error">{error}</p>}
          {!error && !journeys && <p className="loading">Loading journeys…</p>}
          {journeys && journeys.length === 0 && <p className="empty-state">No published journeys yet.</p>}
          {journeys && journeys.length > 0 && (
            <div className="grid-cards">
              {journeys.map((journey, i) => (
                <JourneyCard key={journey.id} journey={journey} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
