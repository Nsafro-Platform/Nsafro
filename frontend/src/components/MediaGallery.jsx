import { useEffect, useState } from 'react'
import { thumbStyle } from '../pages/shared'

// Journey media gallery: the principal image plus every extra photo, with a
// thumbnail strip and a keyboard-navigable lightbox. Journeys without artwork
// fall back to the neutral tinted tile used elsewhere in the app.
export default function MediaGallery({ images = [], title, destination, fallbackIndex = 0 }) {
  const photos = images.filter(Boolean)
  const [openIndex, setOpenIndex] = useState(null)

  useEffect(() => {
    if (openIndex === null) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setOpenIndex(null)
      if (event.key === 'ArrowRight') setOpenIndex((i) => Math.min(i + 1, photos.length - 1))
      if (event.key === 'ArrowLeft') setOpenIndex((i) => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openIndex, photos.length])

  if (photos.length === 0) {
    return (
      <div className="gallery">
        <div className="gallery-empty" style={{ background: thumbStyle(fallbackIndex) }}>
          <span>{(destination || title || '?')[0]}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="gallery">
      <button
        type="button"
        className="gallery-open"
        onClick={() => setOpenIndex(0)}
        aria-label={`View ${title || 'journey'} photos full size`}
      >
        <img src={photos[0]} alt={`${title || 'Journey'} — photo 1 of ${photos.length}`} />
        <span className="gallery-count">
          {photos.length} photo{photos.length > 1 ? 's' : ''}
        </span>
      </button>

      {photos.length > 1 && (
        <ul className="gallery-thumbs">
          {photos.map((url, index) => (
            <li key={url}>
              <button
                type="button"
                className={`gallery-thumb${index === 0 ? ' active' : ''}`}
                onClick={() => setOpenIndex(index)}
                aria-label={`Open photo ${index + 1} of ${photos.length}`}
              >
                <img src={url} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {openIndex !== null && (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${title || 'Journey'} photos`}
          onClick={() => setOpenIndex(null)}
        >
          <div className="gallery-lightbox-inner" onClick={(event) => event.stopPropagation()}>
            <img
              src={photos[openIndex]}
              alt={`${title || 'Journey'} — photo ${openIndex + 1} of ${photos.length}`}
            />
            <div className="gallery-lightbox-bar">
              <button
                type="button"
                onClick={() => setOpenIndex(Math.max(0, openIndex - 1))}
                disabled={openIndex === 0}
                aria-label="Previous photo"
              >
                ←
              </button>
              <span>
                {openIndex + 1} / {photos.length}
              </span>
              <button
                type="button"
                onClick={() => setOpenIndex(Math.min(photos.length - 1, openIndex + 1))}
                disabled={openIndex === photos.length - 1}
                aria-label="Next photo"
              >
                →
              </button>
              <button type="button" onClick={() => setOpenIndex(null)} aria-label="Close gallery">
                Close ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
