import { useEffect, useState } from 'react'
import { api } from '../../api'

// Server-computed price for the current wizard configuration. The request is
// debounced so changing a number field does not fire one call per keystroke, and
// a response that arrives after the configuration changed is ignored.
export function useQuote(payload) {
  const key = payload ? JSON.stringify(payload) : null
  const [result, setResult] = useState({ key: null, quote: null, error: null })

  useEffect(() => {
    if (!key) return undefined
    let cancelled = false
    const timer = setTimeout(() => {
      api
        .quoteReservation(JSON.parse(key))
        .then((data) => {
          if (!cancelled) setResult({ key, quote: data, error: null })
        })
        .catch((err) => {
          if (!cancelled) setResult({ key, quote: null, error: err.message })
        })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [key])

  // Incomplete configuration: nothing to price.
  if (!key) return { quote: null, error: null, loading: false }
  // The configuration changed: keep the previous total visible while the new one
  // is calculated, and flag that it is being updated.
  if (result.key !== key) return { quote: result.quote, error: null, loading: true }
  return { quote: result.quote, error: result.error, loading: false }
}
