// Thin wrapper around fetch for the Journey Platform API.
// All requests carry credentials so the httpOnly auth cookie works.

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    // Non-JSON or empty response body stays null.
  }

  if (!res.ok) {
    const message = data && data.error ? data.error : `Request failed (${res.status})`
    throw new ApiError(message, res.status)
  }
  return data
}

export function formatPrice(value) {
  return `MAD ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  googleClientId: () => request('/auth/google/client-id'),
  googleSignIn: (credential) => request('/auth/google', { method: 'POST', body: { credential } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  // Journeys (paginated: page, limit; filters: q, destination, maxPrice, group, sort)
  journeys: (params = {}) => {
    const qs = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') qs.set(key, value)
    }
    const query = qs.toString()
    return request(`/journeys${query ? `?${query}` : ''}`)
  },
  journey: (id) => request(`/journeys/${id}`),

  // Bookings (simulated payment only — see /bookings/:id/pay)
  createBooking: (payload) => request('/bookings', { method: 'POST', body: payload }),
  myBookings: () => request('/bookings'),
  booking: (id) => request(`/bookings/${id}`),
  pay: (id, simulate = 'success') => request(`/bookings/${id}/pay`, { method: 'POST', body: { simulate } }),

  // Reservations (multi-type wizard: PERSONAL | GROUP | CUSTOM)
  reservationCatalog: () => request('/reservations/catalog'),
  quoteReservation: (payload) => request('/reservations/quote', { method: 'POST', body: payload }),
  createReservation: (payload) => request('/reservations', { method: 'POST', body: payload }),
  reservation: (id) => request(`/reservations/${id}`),
  payReservation: (id, simulate = 'success') =>
    request(`/reservations/${id}/pay`, { method: 'POST', body: { simulate } }),

  // Admin
  adminStats: () => request('/admin/dashboard/stats'),
  adminUsers: () => request('/admin/users'),
  adminUpdateUserRole: (id, role) => request(`/admin/users/${id}/role`, { method: 'PATCH', body: { role } }),
  adminBookings: () => request('/admin/bookings'),
  adminUpdateBooking: (id, payload) => request(`/admin/bookings/${id}`, { method: 'PATCH', body: payload }),
  adminQuoteRequests: () => request('/admin/quote-requests'),
  adminUpdateQuoteRequest: (id, payload) => request(`/admin/quote-requests/${id}`, { method: 'PATCH', body: payload }),
  adminCreateJourney: (payload) => request('/journeys', { method: 'POST', body: payload }),
  adminUpdateJourney: (id, payload) => request(`/journeys/${id}`, { method: 'PATCH', body: payload }),
  adminDeleteJourney: (id) => request(`/journeys/${id}`, { method: 'DELETE' }),
  adminOptions: () => request('/options'),
  adminCreateOption: (payload) => request('/admin/options', { method: 'POST', body: payload }),
  adminUpdateOption: (id, payload) => request(`/admin/options/${id}`, { method: 'PATCH', body: payload }),
  adminDeleteOption: (id) => request(`/admin/options/${id}`, { method: 'DELETE' }),
  adminDestinations: () => request('/admin/destinations'),
}
