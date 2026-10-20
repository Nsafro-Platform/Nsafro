// Skeleton placeholders shaped like the content they stand in for. They keep
// the page structure stable while a request is in flight instead of collapsing
// the area to a line of text.
//
// Each block is announced as a live status region so assistive technology still
// gets a "Loading…" message.

function Status({ label }) {
  return <span className="sr-only">{label}</span>
}

export function JourneyCardsSkeleton({ count = 6, label = 'Loading journeys' }) {
  return (
    <div className="grid-cards" role="status" aria-busy="true">
      <Status label={label} />
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-card" key={index} aria-hidden="true">
          <div className="skeleton skeleton-thumb" />
          <div className="skeleton skeleton-line medium" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line short" />
        </div>
      ))}
    </div>
  )
}

export function JourneyDetailSkeleton({ label = 'Loading journey' }) {
  return (
    <div className="detail-grid" role="status" aria-busy="true">
      <Status label={label} />
      <div aria-hidden="true">
        <div className="skeleton skeleton-hero" />
        <div className="skeleton skeleton-line medium mt-24" />
        <div className="skeleton skeleton-line mt-12" />
        <div className="skeleton skeleton-line short mt-12" />
      </div>
      <div className="skeleton skeleton-side" aria-hidden="true" />
    </div>
  )
}

export function TableSkeleton({ rows = 5, label = 'Loading list' }) {
  return (
    <div className="skeleton-panel" role="status" aria-busy="true">
      <Status label={label} />
      {Array.from({ length: rows }, (_, index) => (
        <div className="skeleton-row" key={index} aria-hidden="true">
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line medium" />
          <div className="skeleton skeleton-line short" />
        </div>
      ))}
    </div>
  )
}

export function PanelSkeleton({ lines = 4, label = 'Loading' }) {
  return (
    <div className="skeleton-panel" role="status" aria-busy="true">
      <Status label={label} />
      <div aria-hidden="true">
        {Array.from({ length: lines }, (_, index) => (
          <div
            className={`skeleton skeleton-line ${index === 0 ? 'medium' : index % 2 ? 'short' : ''}${index > 0 ? ' mt-12' : ''}`}
            key={index}
          />
        ))}
      </div>
    </div>
  )
}
