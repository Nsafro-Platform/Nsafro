import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { JourneyCard } from './shared'
import { JourneyCardsSkeleton } from '../components/Loading'

const INITIAL = {
  q: '',
  destination: '',
  maxPrice: '',
  group: '',
  available: '',
  sort: '',
}

const PAGE_SIZE = 9

export default function Journeys() {
  const [filters, setFilters] = useState(INITIAL)
  const [page, setPage] = useState(1)
  const [pageData, setPageData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .journeys({ ...filters, page, limit: PAGE_SIZE })
      .then((data) => {
        if (!cancelled) {
          setPageData(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [filters, page])

  // Filters reset the catalogue to the first page.
  function set(name, value) {
    setPage(1)
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  function goToPage(next) {
    const target = Math.min(Math.max(next, 1), pageData ? pageData.totalPages : 1)
    if (target === page) return
    setPage(target)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Page links around the current page (max 5 buttons).
  function pageLinks(totalPages) {
    const first = Math.max(1, Math.min(page - 2, totalPages - 4))
    const last = Math.min(totalPages, first + 4)
    const links = []
    for (let n = first; n <= last; n++) links.push(n)
    return links
  }

  const journeys = pageData?.journeys

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <p className="subheading">Journey catalogue</p>
          <h2>All journey offers</h2>
        </div>

        <form className="filters" onSubmit={(e) => e.preventDefault()} aria-label="Journey filters">
          <div className="field grow">
            <label htmlFor="f-q">Search</label>
            <input
              id="f-q"
              type="search"
              placeholder="Title, destination, summary…"
              value={filters.q}
              onChange={(e) => set('q', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="f-destination">Destination</label>
            <input
              id="f-destination"
              type="search"
              placeholder="e.g. Marrakech"
              value={filters.destination}
              onChange={(e) => set('destination', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="f-price">Max price (MAD)</label>
            <input
              id="f-price"
              type="number"
              min="0"
              step="1"
              placeholder="Any"
              value={filters.maxPrice}
              onChange={(e) => set('maxPrice', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="f-group">Type</label>
            <select id="f-group" value={filters.group} onChange={(e) => set('group', e.target.value)}>
              <option value="">All</option>
              <option value="true">Group journeys</option>
              <option value="false">Individual</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-available">Availability</label>
            <select
              id="f-available"
              value={filters.available}
              onChange={(e) => set('available', e.target.value)}
            >
              <option value="">Any</option>
              <option value="true">Seats available</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-sort">Sort</label>
            <select id="f-sort" value={filters.sort} onChange={(e) => set('sort', e.target.value)}>
              <option value="">Date (soonest)</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </div>
          <div className="field actions">
            <button type="button" className="btn btn-outline" onClick={() => setFilters(INITIAL)}>
              Reset
            </button>
          </div>
        </form>

        {error && <p className="alert alert-error">{error}</p>}
        {!error && !journeys && <JourneyCardsSkeleton count={PAGE_SIZE} />}
        {journeys && journeys.length === 0 && (
          <p className="empty-state">
            No journeys match these filters. Try <Link to="/journeys" onClick={() => { setPage(1); setFilters(INITIAL) }}>resetting</Link> them.
          </p>
        )}
        {journeys && journeys.length > 0 && (
          <p className="page-sub">
            Showing {(pageData.page - 1) * PAGE_SIZE + 1}–
            {((pageData.page - 1) * PAGE_SIZE) + journeys.length} of {pageData.total} journeys
          </p>
        )}
        {journeys && (
          <div className="grid-cards">
            {journeys.map((journey) => (
              <JourneyCard key={journey.id} journey={journey} index={journey.id} />
              ))}
          </div>
        )}

        {pageData && pageData.totalPages > 1 && (
          <nav className="pager" aria-label="Catalogue pages">
            <button type="button" className="btn btn-outline" onClick={() => goToPage(page - 1)} disabled={page === 1}>
              ← Prev
            </button>
            {pageLinks(pageData.totalPages).map((n) => (
              <button
                key={n}
                type="button"
                className={`btn ${n === page ? 'btn-purple' : 'btn-outline'}`}
                aria-current={n === page ? 'page' : undefined}
                onClick={() => goToPage(n)}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => goToPage(page + 1)}
              disabled={page === pageData.totalPages}
            >
              Next →
            </button>
          </nav>
        )}
      </div>
    </section>
  )
}

