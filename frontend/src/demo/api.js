// Browser-side stand-in for the Express API, used only by the static GitHub
// Pages build (VITE_DEMO_MODE=true). It implements the same routes, response
// shapes and server-side pricing rules as backend/src, keeping the demo data in
// localStorage so a visitor can sign in, book, pay and manage the back office
// without any server.
//
// This is demo data only: passwords and "payments" never leave the browser.

import {
  DEMO_PASSWORD,
  EXTRA_JOURNEYS,
  FLAGSHIP_JOURNEYS,
  JOURNEY_IMAGE,
  OPTION_SEEDS,
} from './seed'

const STORAGE_KEY = 'nsafro-demo-db'
const STORAGE_VERSION = 1
const SESSION_KEY = 'nsafro-demo-session'

class DemoError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// ---- Pricing rules (mirrors backend/src/pricing.js) ----

const RESERVATION_TYPES = ['PERSONAL', 'GROUP', 'CUSTOM']

const SERVICE_TIERS = [
  { id: 'standard', label: 'Standard', multiplier: 1, description: 'Standard service, shared transport.' },
  { id: 'comfort', label: 'Comfort', multiplier: 1.25, description: 'Extra legroom, slower pace, flexible hours.' },
  { id: 'premium', label: 'Premium', multiplier: 1.6, description: 'Priority departures and upgraded rooms.' },
  { id: 'luxury', label: 'Luxury', multiplier: 2, description: 'Private guide and top-tier accommodation.' },
]

const COMFORT_PREFERENCES = ['Standard seat', 'Extra legroom', 'Front row']
const SCHEDULE_PREFERENCES = ['Early morning', 'Midday', 'Afternoon', 'Evening']
const PARTY_TYPES = ['family', 'friends', 'colleagues', 'solo']

const TAX_RATE = 0.1
const SERVICE_FEE_CENTS = 2500
const CUSTOM_PLANNING_FEE_CENTS = 15000

function toCents(value) {
  return Math.round(Number(value) * 100)
}

function money(cents) {
  return (cents / 100).toFixed(2)
}

function finalizePricing(subtotalCents, lines) {
  const taxCents = Math.round(subtotalCents * TAX_RATE)
  const totalCents = subtotalCents + taxCents + SERVICE_FEE_CENTS
  return {
    subtotal: money(subtotalCents),
    taxes: money(taxCents),
    fees: money(SERVICE_FEE_CENTS),
    total: money(totalCents),
    lines: [
      ...lines.map(({ label, detail, cents }) => ({ label, detail, amount: money(cents) })),
      {
        label: 'Taxes',
        detail: `${TAX_RATE * 100}% on the subtotal`,
        amount: money(taxCents),
      },
      {
        label: 'Service fee',
        detail: 'Flat simulated checkout fee',
        amount: money(SERVICE_FEE_CENTS),
      },
    ],
  }
}

// ---- Seed state ----

function dayOffset(offsetDays) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

function timestampOffset(offsetDays) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString()
}

function reference(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function createState() {
  const users = [
    { id: 1, email: 'admin@journey.demo', password: DEMO_PASSWORD, fullName: 'Demo Admin', role: 'admin', createdAt: timestampOffset(-120) },
    { id: 2, email: 'demo@journey.demo', password: DEMO_PASSWORD, fullName: 'Demo Traveller', role: 'user', createdAt: timestampOffset(-90) },
    { id: 3, email: 'sara@journey.demo', password: DEMO_PASSWORD, fullName: 'Sara El Amrani', role: 'user', createdAt: timestampOffset(-40) },
    { id: 4, email: 'youssef@journey.demo', password: DEMO_PASSWORD, fullName: 'Youssef Benali', role: 'user', createdAt: timestampOffset(-12) },
  ]

  const options = OPTION_SEEDS.map(([category, name, description, price], index) => ({
    id: index + 1,
    category,
    name,
    description,
    price,
  }))

  const journeys = []
  for (const seed of FLAGSHIP_JOURNEYS) {
    journeys.push({
      id: journeys.length + 1,
      title: seed.title,
      summary: seed.summary,
      description: seed.description,
      destination: seed.destination,
      startDate: dayOffset(seed.startOffset),
      endDate: dayOffset(seed.endOffset),
      durationDays: seed.endOffset - seed.startOffset + 1,
      price: seed.price,
      capacity: seed.capacity,
      transport: seed.transport,
      accommodation: seed.accommodation,
      imageUrl: JOURNEY_IMAGE(seed.title),
      images: [JOURNEY_IMAGE(seed.title)].filter(Boolean),
      isGroup: seed.isGroup,
      program: seed.program,
      status: 'published',
    })
  }

  const transports = ['Flight included', 'Private transfer', 'Public bus', 'Train included', 'Minibus shuttle']
  const stays = ['Riad (B&B)', 'Guesthouse', 'Medina hotel (B&B)', 'Surf lodge', 'Boutique hotel']

  EXTRA_JOURNEYS.forEach(([title, destination, summary, description], index) => {
    const startOffset = 7 + ((index * 11) % 120)
    const durationDays = 2 + ((index * 3) % 6) + 1
    journeys.push({
      id: journeys.length + 1,
      title,
      summary,
      description,
      destination,
      startDate: dayOffset(startOffset),
      endDate: dayOffset(startOffset + durationDays - 1),
      durationDays,
      price: String(Math.round((240 + ((index * 173) % 1150)) / 50) * 50),
      capacity: 6 + ((index * 7) % 14),
      transport: transports[index % transports.length],
      accommodation: stays[(index + 2) % stays.length],
      imageUrl: null,
      images: [],
      isGroup: index % 3 !== 2,
      program: '',
      // One draft offer stays visible to the admin demo only.
      status: index === 18 ? 'draft' : 'published',
    })
  })

  const byTitle = (title) => journeys.find((journey) => journey.title === title)
  const marrakech = byTitle('Marrakech City Break')
  const atlas = byTitle('Atlas Mountains Trek')
  const sahara = byTitle('Sahara Desert Nights')

  const bookings = [
    {
      id: 1,
      reference: 'JRN-4K7M2Q',
      userId: 2,
      journeyId: marrakech.id,
      travellersCount: 2,
      unitPrice: marrakech.price,
      totalPrice: money(toCents(marrakech.price) * 2),
      status: 'confirmed',
      paymentStatus: 'paid',
      createdAt: timestampOffset(-20),
      participants: [
        { id: 1, fullName: 'Demo Traveller', status: 'confirmed' },
        { id: 2, fullName: 'Amina Alaoui', status: 'invited' },
      ],
    },
    {
      id: 2,
      reference: 'JRN-9X2B7C',
      userId: 2,
      journeyId: atlas.id,
      travellersCount: 1,
      unitPrice: atlas.price,
      totalPrice: atlas.price,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: timestampOffset(-3),
      participants: [{ id: 3, fullName: 'Demo Traveller', status: 'confirmed' }],
    },
    {
      id: 3,
      reference: 'JRN-2P8D5F',
      userId: 4,
      journeyId: sahara.id,
      travellersCount: 3,
      unitPrice: sahara.price,
      totalPrice: money(toCents(sahara.price) * 3),
      status: 'confirmed',
      paymentStatus: 'paid',
      createdAt: timestampOffset(-7),
      participants: [
        { id: 4, fullName: 'Youssef Benali', status: 'confirmed' },
        { id: 5, fullName: 'Nadia Benali', status: 'invited' },
        { id: 6, fullName: 'Omar Benali', status: 'invited' },
      ],
    },
  ]

  const quoteRequests = [
    {
      id: 1,
      status: 'submitted',
      agentNote: null,
      submittedAt: timestampOffset(-5),
      updatedAt: timestampOffset(-5),
      userId: 2,
      itineraryId: 1,
      itineraryTitle: 'Marrakech & Atlas custom trip',
      indicatedTotal: '1250.00',
    },
    {
      id: 2,
      status: 'in_review',
      agentNote: 'Waiting for the family to confirm dates.',
      submittedAt: timestampOffset(-2),
      updatedAt: timestampOffset(-1),
      userId: 4,
      itineraryId: 2,
      itineraryTitle: 'Sahara family escape',
      indicatedTotal: '980.00',
    },
  ]

  return {
    version: STORAGE_VERSION,
    users,
    journeys,
    options,
    bookings,
    reservations: [],
    quotes: quoteRequests,
    counters: {
      user: 5,
      journey: journeys.length + 1,
      option: options.length + 1,
      booking: 4,
      reservation: 1,
      quote: 3,
      participant: 7,
    },
  }
}

// ---- Store ----

let state = null

function getState() {
  if (state) return state
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (saved && saved.version === STORAGE_VERSION) {
      state = saved
      return state
    }
  } catch {
    // Corrupt or unavailable storage: fall back to the seed.
  }
  state = createState()
  persist()
  return state
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Private-browsing quota issues should not break the demo.
  }
}

function nextId(collection) {
  const db = getState()
  const id = db.counters[collection]
  db.counters[collection] += 1
  return id
}

// ---- Session ----

function currentUser() {
  const id = Number(localStorage.getItem(SESSION_KEY))
  return getState().users.find((user) => user.id === id) || null
}

function setSession(user) {
  localStorage.setItem(SESSION_KEY, String(user.id))
}

function publicUser(user) {
  return { id: user.id, email: user.email, fullName: user.fullName, role: user.role }
}

function requireUser() {
  const user = currentUser()
  if (!user) throw new DemoError('Sign in to continue', 401)
  return user
}

function requireAdmin() {
  const user = requireUser()
  if (user.role !== 'admin') throw new DemoError('Admin access required', 403)
  return user
}

// ---- Serialization ----

function seatsTaken(journeyId) {
  const db = getState()
  const counts = (rows) =>
    rows
      .filter((row) => row.journeyId === journeyId && (row.status === 'pending' || row.status === 'confirmed'))
      .reduce((sum, row) => sum + row.travellersCount, 0)
  return counts(db.bookings) + counts(db.reservations)
}

function journeyJson(journey) {
  const bookedSeats = seatsTaken(journey.id)
  return {
    id: journey.id,
    title: journey.title,
    summary: journey.summary,
    description: journey.description,
    destination: journey.destination,
    startDate: journey.startDate,
    endDate: journey.endDate,
    durationDays: journey.durationDays,
    price: journey.price,
    capacity: journey.capacity,
    transport: journey.transport,
    accommodation: journey.accommodation,
    imageUrl: journey.imageUrl,
    images: journey.images || [],
    isGroup: journey.isGroup,
    program: journey.program,
    status: journey.status,
    bookedSeats,
    remainingSeats: Math.max(journey.capacity - bookedSeats, 0),
  }
}

function journeySnapshot(journey) {
  return {
    id: journey.id,
    title: journey.title,
    destination: journey.destination,
    startDate: journey.startDate,
    endDate: journey.endDate,
    durationDays: journey.durationDays,
    transport: journey.transport,
    capacity: journey.capacity,
    remainingSeats: journeyJson(journey).remainingSeats,
  }
}

function bookingJson(booking, extra = {}) {
  return {
    id: booking.id,
    reference: booking.reference,
    journeyId: booking.journeyId,
    travellersCount: booking.travellersCount,
    unitPrice: booking.unitPrice,
    totalPrice: booking.totalPrice,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    createdAt: booking.createdAt,
    ...extra,
  }
}

function bookingDetail(booking) {
  const journey = getState().journeys.find((row) => row.id === booking.journeyId)
  return bookingJson(booking, {
    journey: journey ? journeySnapshot(journey) : null,
    participants: booking.participants || [],
  })
}

function reservationJson(reservation, extra = {}) {
  return {
    id: reservation.id,
    reference: reservation.reference,
    reservationType: reservation.reservationType,
    journeyId: reservation.journeyId,
    travellersCount: reservation.travellersCount,
    selectedOptions: reservation.selectedOptions,
    pricing: reservation.pricing,
    status: reservation.status,
    paymentStatus: reservation.paymentStatus,
    createdAt: reservation.createdAt,
    ...extra,
  }
}

function optionJson(option) {
  return {
    id: option.id,
    category: option.category,
    name: option.name,
    description: option.description,
    price: option.price,
  }
}

// ---- Journey validation (mirrors backend/src/routes/journeys.js) ----

const JOURNEY_STATUSES = ['draft', 'published', 'archived']

function validateJourneyPayload(body, partial) {
  const data = {}
  if (!partial) {
    if (!body.title?.trim()) throw new DemoError('title must be a non-empty string', 400)
    if (!body.destination?.trim()) throw new DemoError('destination must be a non-empty string', 400)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.start_date || '')) throw new DemoError('start_date must be a YYYY-MM-DD date', 400)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.end_date || '')) throw new DemoError('end_date must be a YYYY-MM-DD date', 400)
    if (!Number.isFinite(Number(body.price))) throw new DemoError('price is required', 400)
    if (!Number.isInteger(Number(body.capacity)) || Number(body.capacity) < 1) {
      throw new DemoError('capacity must be a positive integer', 400)
    }
  }

  for (const field of ['title', 'summary', 'description', 'destination', 'transport', 'accommodation', 'program']) {
    if (body[field] !== undefined) data[field] = String(body[field]).trim()
  }
  for (const field of ['start_date', 'end_date']) {
    if (body[field] !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body[field])) throw new DemoError(`${field} must be a YYYY-MM-DD date`, 400)
      data[field] = body[field]
    }
  }
  if (body.price !== undefined) {
    const price = Number(body.price)
    if (!Number.isFinite(price) || price < 0) throw new DemoError('price must be a non-negative number', 400)
    data.price = price.toFixed(2)
  }
  if (body.capacity !== undefined) {
    const capacity = Number(body.capacity)
    if (!Number.isInteger(capacity) || capacity < 1) throw new DemoError('capacity must be a positive integer', 400)
    data.capacity = capacity
  }
  if (body.image_url !== undefined) data.imageUrl = body.image_url || null
  if (body.is_group !== undefined) data.isGroup = Boolean(body.is_group)
  if (body.status !== undefined) {
    if (!JOURNEY_STATUSES.includes(body.status)) throw new DemoError('status must be draft, published or archived', 400)
    data.status = body.status
  }
  if (data.start_date && data.end_date && data.end_date < data.start_date) {
    throw new DemoError('end_date must be on or after start_date', 400)
  }
  if (data.start_date && data.end_date) {
    data.durationDays = Math.round((Date.parse(data.end_date) - Date.parse(data.start_date)) / 86400000) + 1
  }
  return data
}

function applyJourneyPayload(journey, data) {
  const fields = [
    'title', 'summary', 'description', 'destination', 'price', 'capacity',
    'transport', 'accommodation', 'isGroup', 'program', 'status', 'imageUrl',
  ]
  for (const field of fields) {
    if (data[field] !== undefined) journey[field] = data[field]
  }
  if (data.start_date !== undefined) journey.startDate = data.start_date
  if (data.end_date !== undefined) journey.endDate = data.end_date
  if (data.durationDays !== undefined) journey.durationDays = data.durationDays
  journey.images = journey.imageUrl ? [journey.imageUrl] : []
}

// ---- Reservation pricing (mirrors backend/src/routes/reservations.js) ----

const MAX_TRAVELLERS = 20
const MAX_CUSTOM_MEMBERS = 30

function publishedJourney(id) {
  const journey = getState().journeys.find((row) => row.id === Number(id))
  if (!journey || journey.status !== 'published') throw new DemoError('Journey not found', 404)
  return journey
}

function optionById(id, category, fieldName) {
  const option = getState().options.find((row) => row.id === Number(id))
  if (!option) throw new DemoError(`${fieldName} is not a valid option`, 400)
  if (category && option.category !== category) throw new DemoError(`${fieldName} must be a ${category} option`, 400)
  return option
}

function participantNames(body, travellers) {
  const participants = Array.isArray(body.participants) ? body.participants : []
  if (participants.length > 0 && participants.length !== travellers) {
    throw new DemoError('participants count must match travellersCount', 400)
  }
  return participants.map((participant) => {
    if (!participant.fullName || !String(participant.fullName).trim()) {
      throw new DemoError('each participant needs a fullName', 400)
    }
    return String(participant.fullName).trim()
  })
}

function resolveReservation(body) {
  const reservationType = body.reservationType
  if (!RESERVATION_TYPES.includes(reservationType)) {
    throw new DemoError(`reservationType must be one of ${RESERVATION_TYPES.join(', ')}`, 400)
  }

  if (reservationType === 'PERSONAL') {
    const travellers = Number(body.travellersCount)
    if (!Number.isInteger(travellers) || travellers < 1 || travellers > MAX_TRAVELLERS) {
      throw new DemoError(`travellersCount must be between 1 and ${MAX_TRAVELLERS}`, 400)
    }
    const tier = SERVICE_TIERS.find((row) => row.id === body.tier)
    if (!tier) throw new DemoError('tier must be a known service tier', 400)

    const journey = publishedJourney(body.journeyId)
    const transport = optionById(body.transportOptionId, 'transport', 'transportOptionId')
    const preferences = body.preferences || {}
    const comfort = COMFORT_PREFERENCES.includes(preferences.comfort) ? preferences.comfort : ''
    const schedule = SCHEDULE_PREFERENCES.includes(preferences.schedule) ? preferences.schedule : ''

    const journeyCents = toCents(journey.price)
    const transportCents = toCents(transport.price)
    const perTravellerCents = Math.round(journeyCents * tier.multiplier) + transportCents
    const subtotalCents = perTravellerCents * travellers

    return {
      reservationType,
      journeyId: journey.id,
      travellersCount: travellers,
      participants: [],
      pricing: finalizePricing(subtotalCents, [
        {
          label: `${journey.title} — ${tier.label}`,
          detail: `${money(journeyCents)} × ${travellers} traveller(s), tier ×${tier.multiplier}`,
          cents: Math.round(journeyCents * tier.multiplier) * travellers,
        },
        {
          label: transport.name,
          detail: `${money(transportCents)} × ${travellers} traveller(s)`,
          cents: transportCents * travellers,
        },
      ]),
      selectedOptions: {
        tier: tier.id,
        tierLabel: tier.label,
        tierMultiplier: tier.multiplier,
        preferences: { comfort, schedule },
        transport: optionJson(transport),
        unitPrice: money(perTravellerCents),
        travellers,
        journey: {
          id: journey.id,
          title: journey.title,
          destination: journey.destination,
          startDate: journey.startDate,
          endDate: journey.endDate,
        },
      },
    }
  }

  if (reservationType === 'GROUP') {
    const travellers = Number(body.travellersCount)
    if (!Number.isInteger(travellers) || travellers < 1 || travellers > MAX_TRAVELLERS) {
      throw new DemoError(`travellersCount must be between 1 and ${MAX_TRAVELLERS}`, 400)
    }
    const journey = publishedJourney(body.journeyId)
    if (!journey.isGroup) throw new DemoError('This journey is not an organized group journey', 400)

    const participants = participantNames(body, travellers)
    const subtotalCents = toCents(journey.price) * travellers

    return {
      reservationType,
      journeyId: journey.id,
      travellersCount: travellers,
      participants,
      pricing: finalizePricing(subtotalCents, [
        {
          label: journey.title,
          detail: `${money(toCents(journey.price))} × ${travellers} participant(s)`,
          cents: subtotalCents,
        },
      ]),
      selectedOptions: {
        journey: {
          id: journey.id,
          title: journey.title,
          destination: journey.destination,
          startDate: journey.startDate,
          endDate: journey.endDate,
          durationDays: journey.durationDays,
          program: journey.program,
        },
        participants: travellers,
        remainingSeats: journeyJson(journey).remainingSeats,
      },
    }
  }

  // CUSTOM — destinations, stopover experiences, party size and transport.
  const members = Number(body.members)
  if (!Number.isInteger(members) || members < 1 || members > MAX_CUSTOM_MEMBERS) {
    throw new DemoError(`members must be between 1 and ${MAX_CUSTOM_MEMBERS}`, 400)
  }
  if (!PARTY_TYPES.includes(body.partyType)) throw new DemoError('partyType must be a known party type', 400)

  const destinations = Array.isArray(body.destinations)
    ? body.destinations.filter((value) => value && String(value).trim()).map((value) => String(value).trim())
    : []
  if (destinations.length === 0) throw new DemoError('at least one destination is required', 400)
  if (destinations.length > 5) throw new DemoError('a custom trip is limited to 5 destinations', 400)

  const knownDestinations = new Set(
    getState().journeys.filter((row) => row.status === 'published').map((row) => row.destination),
  )
  for (const destination of destinations) {
    if (!knownDestinations.has(destination)) throw new DemoError(`Unknown destination: ${destination}`, 400)
  }

  const stopoverIds = Array.isArray(body.stopoverOptionIds)
    ? [...new Set(body.stopoverOptionIds.map((id) => Number(id)))]
    : []
  if (stopoverIds.length > 8) throw new DemoError('at most 8 stopover experiences per trip', 400)

  const transport = optionById(body.transportOptionId, 'transport', 'transportOptionId')
  const stopovers = stopoverIds.map((id) => optionById(id, 'activity', 'stopoverOptionIds'))

  const transportCents = toCents(transport.price)
  const stopoverCents = stopovers.reduce((sum, option) => sum + toCents(option.price), 0)
  const subtotalCents = CUSTOM_PLANNING_FEE_CENTS + (transportCents + stopoverCents) * members

  return {
    reservationType,
    journeyId: null,
    travellersCount: members,
    participants: [],
    pricing: finalizePricing(subtotalCents, [
      {
        label: 'Custom-trip planning fee',
        detail: 'Itinerary built by a local agent (fixed)',
        cents: CUSTOM_PLANNING_FEE_CENTS,
      },
      {
        label: transport.name,
        detail: `${money(transportCents)} × ${members} member(s)`,
        cents: transportCents * members,
      },
      ...stopovers.map((stopover) => ({
        label: stopover.name,
        detail: `${money(toCents(stopover.price))} × ${members} member(s)`,
        cents: toCents(stopover.price) * members,
      })),
    ]),
    selectedOptions: {
      destinations,
      partyType: body.partyType,
      members,
      transport: optionJson(transport),
      stopoverPlaces: stopovers.map(optionJson),
    },
  }
}

// ---- Route handlers ----

function listJourneys(query) {
  const db = getState()
  const user = currentUser()
  const isAdmin = user?.role === 'admin'

  let rows = db.journeys.filter((journey) => (isAdmin ? true : journey.status === 'published'))

  const q = (query.get('q') || '').trim().toLowerCase()
  if (q) {
    rows = rows.filter((journey) =>
      [journey.title, journey.destination, journey.summary].some((value) =>
        String(value || '').toLowerCase().includes(q),
      ),
    )
  }
  const destination = (query.get('destination') || '').trim().toLowerCase()
  if (destination) {
    rows = rows.filter((journey) => journey.destination.toLowerCase().includes(destination))
  }
  const minPrice = query.get('minPrice')
  if (minPrice !== null && minPrice !== '' && Number.isFinite(Number(minPrice))) {
    rows = rows.filter((journey) => Number(journey.price) >= Number(minPrice))
  }
  const maxPrice = query.get('maxPrice')
  if (maxPrice !== null && maxPrice !== '' && Number.isFinite(Number(maxPrice))) {
    rows = rows.filter((journey) => Number(journey.price) <= Number(maxPrice))
  }
  for (const [field, compare] of [
    ['from', (start, value) => start >= value],
    ['to', (start, value) => start <= value],
  ]) {
    const value = query.get(field)
    if (value === null || value === '') continue
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new DemoError(`${field} must be a YYYY-MM-DD date`, 400)
    rows = rows.filter((journey) => compare(journey.startDate, value))
  }
  const from = query.get('from')
  const to = query.get('to')
  if (from && to && from > to) throw new DemoError('from must be on or before to', 400)

  const group = query.get('group')
  if (group === 'true') rows = rows.filter((journey) => journey.isGroup)
  if (group === 'false') rows = rows.filter((journey) => !journey.isGroup)
  if (query.get('available') === 'true') rows = rows.filter((journey) => journeyJson(journey).remainingSeats > 0)

  const sort = query.get('sort')
  rows = [...rows].sort((a, b) => {
    if (sort === 'price_asc') return Number(a.price) - Number(b.price) || a.startDate.localeCompare(b.startDate)
    if (sort === 'price_desc') return Number(b.price) - Number(a.price) || a.startDate.localeCompare(b.startDate)
    return a.startDate.localeCompare(b.startDate) || a.id - b.id
  })

  const limitParam = query.get('limit')
  const limitValue = Number(limitParam)
  const limit = limitParam !== null && limitParam !== '' && Number.isFinite(limitValue)
    ? Math.min(Math.max(Math.floor(limitValue), 1), 50)
    : 12
  const pageParam = query.get('page')
  const pageValue = Number(pageParam)
  const page = pageParam !== null && pageParam !== '' && Number.isFinite(pageValue)
    ? Math.max(Math.floor(pageValue), 1)
    : 1
  const total = rows.length

  return {
    journeys: rows.slice((page - 1) * limit, page * limit).map(journeyJson),
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  }
}

function register(body) {
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const fullName = String(body.fullName || '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DemoError('A valid email is required', 400)
  if (password.length < 8 || password.length > 100) throw new DemoError('Password must be 8-100 characters', 400)
  if (!fullName) throw new DemoError('Full name is required', 400)

  const db = getState()
  if (db.users.some((user) => user.email === email)) {
    throw new DemoError('An account with this email already exists', 400)
  }
  const user = {
    id: nextId('user'),
    email,
    password,
    fullName,
    role: 'user',
    createdAt: new Date().toISOString(),
  }
  db.users.push(user)
  setSession(user)
  persist()
  return { user: publicUser(user) }
}

function login(body) {
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const user = getState().users.find((row) => row.email === email)
  if (!user || user.password !== password) throw new DemoError('Invalid email or password', 401)
  setSession(user)
  return { user: publicUser(user) }
}

function createBooking(user, body) {
  const journeyId = Number(body.journeyId)
  const travellers = Number(body.travellersCount)
  const db = getState()
  const journey = db.journeys.find((row) => row.id === journeyId)
  if (!journey || journey.status !== 'published') throw new DemoError('Journey not found', 404)
  if (!Number.isInteger(travellers) || travellers < 1 || travellers > MAX_TRAVELLERS) {
    throw new DemoError(`travellersCount must be between 1 and ${MAX_TRAVELLERS}`, 400)
  }

  const participants = Array.isArray(body.participants) ? body.participants : []
  if (participants.length > 0 && participants.length !== travellers) {
    throw new DemoError('participants count must match travellersCount', 400)
  }
  for (const participant of participants) {
    if (!participant.fullName || !String(participant.fullName).trim()) {
      throw new DemoError('each participant needs a fullName', 400)
    }
  }

  if (seatsTaken(journeyId) + travellers > journey.capacity) {
    throw new DemoError('Not enough capacity for this journey', 409)
  }

  const payerName = user.fullName.trim().toLowerCase()
  const booking = {
    id: nextId('booking'),
    reference: reference('JRN'),
    userId: user.id,
    journeyId,
    travellersCount: travellers,
    unitPrice: journey.price,
    totalPrice: money(toCents(journey.price) * travellers),
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
    participants: participants.map((participant) => {
      const fullName = String(participant.fullName).trim()
      return {
        id: nextId('participant'),
        fullName,
        status: fullName.toLowerCase() === payerName ? 'confirmed' : 'invited',
      }
    }),
  }
  db.bookings.push(booking)
  persist()
  return { booking: bookingDetail(booking) }
}

function updateBooking(user, body, id) {
  const db = getState()
  const booking = db.bookings.find((row) => row.id === id)
  if (!booking) throw new DemoError('Booking not found', 404)
  if (booking.userId !== user.id) throw new DemoError('Not your booking', 403)
  if (booking.status === 'cancelled') throw new DemoError('A cancelled booking cannot be modified', 409)
  if (booking.paymentStatus === 'paid' || booking.status === 'confirmed') {
    throw new DemoError('A paid booking cannot be modified; contact the agency', 409)
  }
  if (body.travellersCount === undefined && body.participants === undefined) {
    throw new DemoError('Nothing to update', 400)
  }

  const travellers = body.travellersCount === undefined ? booking.travellersCount : Number(body.travellersCount)
  if (!Number.isInteger(travellers) || travellers < 1 || travellers > MAX_TRAVELLERS) {
    throw new DemoError(`travellersCount must be between 1 and ${MAX_TRAVELLERS}`, 400)
  }

  let participants = booking.participants || []
  if (body.participants !== undefined) {
    participants = Array.isArray(body.participants) ? body.participants : []
    if (participants.length !== travellers) {
      throw new DemoError('participants count must match travellersCount', 400)
    }
    for (const participant of participants) {
      if (!participant.fullName || !String(participant.fullName).trim()) {
        throw new DemoError('each participant needs a fullName', 400)
      }
    }
  }

  const otherSeats = seatsTaken(booking.journeyId) - booking.travellersCount
  const journey = db.journeys.find((row) => row.id === booking.journeyId)
  if (!journey) throw new DemoError('Journey not found', 404)
  if (otherSeats + travellers > journey.capacity) throw new DemoError('Not enough capacity for this journey', 409)

  if (body.participants !== undefined) {
    const payerName = user.fullName.trim().toLowerCase()
    booking.participants = participants.map((participant) => {
      const fullName = String(participant.fullName).trim()
      return {
        id: nextId('participant'),
        fullName,
        status: fullName.toLowerCase() === payerName ? 'confirmed' : 'invited',
      }
    })
  }
  booking.travellersCount = travellers
  booking.totalPrice = money(toCents(booking.unitPrice) * travellers)
  persist()
  return { booking: bookingDetail(booking) }
}

function payBooking(user, id, simulate) {
  const booking = getState().bookings.find((row) => row.id === id)
  if (!booking) throw new DemoError('Booking not found', 404)
  if (booking.userId !== user.id) throw new DemoError('Not your booking', 403)
  if (booking.status === 'cancelled') throw new DemoError('This booking is cancelled', 409)
  if (booking.paymentStatus === 'paid') throw new DemoError('This booking is already paid', 409)

  if (simulate === 'success') {
    booking.paymentStatus = 'paid'
    booking.status = 'confirmed'
  } else {
    booking.paymentStatus = 'failed'
  }
  persist()
  return { booking: bookingJson(booking), payment: { simulated: true, outcome: simulate } }
}

function createReservation(user, body) {
  const resolved = resolveReservation(body)
  if (resolved.journeyId) {
    const journey = publishedJourney(resolved.journeyId)
    if (journeyJson(journey).remainingSeats < resolved.travellersCount) {
      throw new DemoError('Not enough seats left on this journey', 409)
    }
  }

  const reservation = {
    id: nextId('reservation'),
    reference: reference('RSV'),
    userId: user.id,
    reservationType: resolved.reservationType,
    journeyId: resolved.journeyId,
    travellersCount: resolved.travellersCount,
    pricing: resolved.pricing,
    selectedOptions: resolved.selectedOptions,
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
    participants: resolved.participants.map((fullName) => ({
      id: nextId('participant'),
      fullName,
      status: 'invited',
    })),
  }
  getState().reservations.push(reservation)
  persist()

  return {
    reservation: reservationJson(reservation, {
      participants: reservation.participants,
      pricing: { ...resolved.pricing },
    }),
  }
}

function payReservation(user, id, simulate) {
  const reservation = getState().reservations.find((row) => row.id === id)
  if (!reservation) throw new DemoError('Reservation not found', 404)
  if (reservation.userId !== user.id) throw new DemoError('Not your reservation', 403)
  if (reservation.status === 'cancelled') throw new DemoError('This reservation is cancelled', 409)
  if (reservation.paymentStatus === 'paid') throw new DemoError('This reservation is already paid', 409)

  if (simulate === 'success') {
    reservation.paymentStatus = 'paid'
    reservation.status = 'confirmed'
  } else {
    reservation.paymentStatus = 'failed'
  }
  persist()
  return {
    reservation: reservationJson(reservation, { participants: reservation.participants }),
    payment: { simulated: true, outcome: simulate },
  }
}

function stats() {
  const db = getState()
  return {
    users: {
      count: db.users.length,
      admins: db.users.filter((user) => user.role === 'admin').length,
    },
    journeys: {
      count: db.journeys.length,
      published: db.journeys.filter((journey) => journey.status === 'published').length,
      drafts: db.journeys.filter((journey) => journey.status === 'draft').length,
    },
    bookings: {
      count: db.bookings.length,
      paid: db.bookings.filter((booking) => booking.paymentStatus === 'paid').length,
    },
    quotes: {
      count: db.quotes.length,
      submitted: db.quotes.filter((quote) => quote.status === 'submitted').length,
    },
  }
}

function quoteJson(quote) {
  const user = getState().users.find((row) => row.id === quote.userId)
  return {
    id: quote.id,
    status: quote.status,
    agentNote: quote.agentNote,
    submittedAt: quote.submittedAt,
    updatedAt: quote.updatedAt,
    user: { email: user?.email || '', name: user?.fullName || '' },
    itineraryId: quote.itineraryId,
    itineraryTitle: quote.itineraryTitle,
    indicatedTotal: quote.indicatedTotal,
  }
}

// ---- Router ----

export async function demoRequest(path, { method = 'GET', body = {} } = {}) {
  const [rawPath, rawQuery = ''] = path.split('?')
  const parts = rawPath.split('/').filter(Boolean)
  const query = new URLSearchParams(rawQuery)
  const [root, second, third, fourth] = parts

  if (root === 'auth') {
    if (method === 'POST' && second === 'register') return register(body)
    if (method === 'POST' && second === 'login') return login(body)
    if (method === 'POST' && second === 'logout') {
      localStorage.removeItem(SESSION_KEY)
      return { ok: true }
    }
    if (second === 'me') {
      const user = requireUser()
      return { user: publicUser(user) }
    }
    if (second === 'google') {
      if (third === 'client-id') return { clientId: null }
      throw new DemoError('Google sign-in is not configured in the static demo', 503)
    }
    throw new DemoError('Not found', 404)
  }

  if (root === 'journeys') {
    if (!second) {
      if (method === 'GET') return listJourneys(query)
      if (method === 'POST') {
        requireAdmin()
        const data = validateJourneyPayload(body, false)
        const db = getState()
        const journey = {
          id: nextId('journey'),
          images: [],
          imageUrl: null,
          ...data,
        }
        applyJourneyPayload(journey, data)
        db.journeys.push(journey)
        persist()
        return { journey: journeyJson(journey) }
      }
    }
    const id = Number(second)
    if (!Number.isInteger(id)) throw new DemoError('Invalid journey id', 400)
    const journey = getState().journeys.find((row) => row.id === id)
    if (!journey) throw new DemoError('Journey not found', 404)

    if (method === 'GET') {
      const user = currentUser()
      if (journey.status !== 'published' && user?.role !== 'admin') throw new DemoError('Journey not found', 404)
      return { journey: journeyJson(journey) }
    }
    if (method === 'PATCH') {
      requireAdmin()
      const data = validateJourneyPayload(body, true)
      if (data.capacity !== undefined && seatsTaken(id) > data.capacity) {
        throw new DemoError('Capacity cannot be lower than already booked travellers', 409)
      }
      applyJourneyPayload(journey, data)
      persist()
      return { journey: journeyJson(journey) }
    }
    if (method === 'DELETE') {
      requireAdmin()
      if (journey.status === 'archived') throw new DemoError('Journey not found or already archived', 404)
      journey.status = 'archived'
      persist()
      return { ok: true }
    }
  }

  if (root === 'options' && method === 'GET') {
    const category = query.get('category')
    let options = getState().options
    if (category) options = options.filter((option) => option.category === category)
    return { options: options.map(optionJson) }
  }

  if (root === 'bookings') {
    const user = requireUser()
    if (!second && method === 'GET') {
      const db = getState()
      const rows = db.bookings
        .filter((booking) => booking.userId === user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt) || b.id - a.id)
      return { bookings: rows.map((booking) => bookingDetail(booking)) }
    }
    if (!second && method === 'POST') return createBooking(user, body)

    const id = Number(second)
    if (!Number.isInteger(id)) throw new DemoError('Invalid booking id', 400)
    const booking = getState().bookings.find((row) => row.id === id)
    if (!booking) throw new DemoError('Booking not found', 404)
    if (booking.userId !== user.id && user.role !== 'admin') throw new DemoError('Not your booking', 403)

    if (method === 'GET') return { booking: bookingDetail(booking) }
    if (method === 'PATCH') return updateBooking(user, body, id)
    if (method === 'POST' && third === 'pay') {
      const simulate = body.simulate || 'success'
      if (!['success', 'failure'].includes(simulate)) {
        throw new DemoError("simulate must be 'success' or 'failure'", 400)
      }
      return payBooking(user, id, simulate)
    }
  }

  if (root === 'reservations') {
    if (second === 'catalog' && method === 'GET') {
      const db = getState()
      const published = db.journeys.filter((journey) => journey.status === 'published')
      return {
        journeys: published.map(journeyJson),
        destinations: [...new Set(published.map((journey) => journey.destination))].sort(),
        options: [...db.options]
          .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
          .map(optionJson),
        serviceTiers: SERVICE_TIERS,
        preferences: { comfort: COMFORT_PREFERENCES, schedule: SCHEDULE_PREFERENCES },
        partyTypes: PARTY_TYPES,
        pricing: {
          taxRate: TAX_RATE,
          serviceFee: money(SERVICE_FEE_CENTS),
          customPlanningFee: money(CUSTOM_PLANNING_FEE_CENTS),
        },
      }
    }

    const user = requireUser()

    if (second === 'quote' && method === 'POST') {
      const resolved = resolveReservation(body)
      return {
        reservationType: resolved.reservationType,
        selectedOptions: resolved.selectedOptions,
        pricing: resolved.pricing,
      }
    }
    if (!second && method === 'GET') {
      const rows = getState()
        .reservations.filter((reservation) => reservation.userId === user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt) || b.id - a.id)
      return {
        reservations: rows.map((reservation) => {
          const journey = getState().journeys.find((row) => row.id === reservation.journeyId)
          return reservationJson(reservation, {
            journey: journey ? { id: journey.id, title: journey.title, startDate: journey.startDate } : null,
          })
        }),
      }
    }
    if (!second && method === 'POST') return createReservation(user, body)

    const id = Number(second)
    if (!Number.isInteger(id)) throw new DemoError('Invalid reservation id', 400)
    const reservation = getState().reservations.find((row) => row.id === id)
    if (!reservation) throw new DemoError('Reservation not found', 404)
    if (reservation.userId !== user.id && user.role !== 'admin') throw new DemoError('Not your reservation', 403)

    if (method === 'GET') {
      return { reservation: reservationJson(reservation, { participants: reservation.participants || [] }) }
    }
    if (method === 'POST' && third === 'pay') {
      const simulate = body.simulate || 'success'
      if (!['success', 'failure'].includes(simulate)) {
        throw new DemoError("simulate must be 'success' or 'failure'", 400)
      }
      return payReservation(user, id, simulate)
    }
  }

  if (root === 'admin') {
    requireAdmin()
    const db = getState()

    if (second === 'dashboard' && third === 'stats' && method === 'GET') return stats()

    if (second === 'users') {
      if (!third && method === 'GET') {
        return { users: db.users.map((user) => ({ ...publicUser(user), createdAt: user.createdAt })) }
      }
      if (third && fourth === 'role' && method === 'PATCH') {
        const user = db.users.find((row) => row.id === Number(third))
        if (!user) throw new DemoError('User not found', 404)
        if (!['user', 'admin'].includes(body.role)) throw new DemoError('role must be one of: user, admin', 400)
        user.role = body.role
        persist()
        return { user: publicUser(user) }
      }
    }

    if (second === 'bookings') {
      if (!third && method === 'GET') {
        return {
          bookings: db.bookings
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt) || b.id - a.id)
            .map((booking) => {
              const journey = db.journeys.find((row) => row.id === booking.journeyId)
              const user = db.users.find((row) => row.id === booking.userId)
              return {
                ...bookingJson(booking),
                journey: { id: booking.journeyId, title: journey?.title || '' },
                user: { email: user?.email || '', name: user?.fullName || '' },
              }
            }),
        }
      }
      if (third && method === 'PATCH') {
        const booking = db.bookings.find((row) => row.id === Number(third))
        if (!booking) throw new DemoError('Booking not found', 404)
        if (body.status !== undefined) {
          if (!['pending', 'confirmed', 'cancelled'].includes(body.status)) {
            throw new DemoError('status must be one of: pending, confirmed, cancelled', 400)
          }
          booking.status = body.status
        }
        if (body.paymentStatus !== undefined) {
          if (!['pending', 'paid', 'failed', 'refunded'].includes(body.paymentStatus)) {
            throw new DemoError('paymentStatus must be one of: pending, paid, failed, refunded', 400)
          }
          booking.paymentStatus = body.paymentStatus
        }
        persist()
        return { ok: true }
      }
    }

    if (second === 'quote-requests') {
      if (!third && method === 'GET') return { quoteRequests: db.quotes.map(quoteJson) }
      if (third && method === 'PATCH') {
        const quote = db.quotes.find((row) => row.id === Number(third))
        if (!quote) throw new DemoError('Quote request not found', 404)
        if (body.status !== undefined) {
          if (!['submitted', 'in_review', 'quoted', 'rejected'].includes(body.status)) {
            throw new DemoError('status must be one of: submitted, in_review, quoted, rejected', 400)
          }
          quote.status = body.status
        }
        if (body.agentNote !== undefined) quote.agentNote = String(body.agentNote).trim()
        quote.updatedAt = new Date().toISOString()
        persist()
        return { quoteRequest: quoteJson(quote) }
      }
    }

    if (second === 'options') {
      if (!third && method === 'POST') {
        if (!['transport', 'accommodation', 'activity'].includes(body.category)) {
          throw new DemoError('Invalid category', 400)
        }
        if (!String(body.name || '').trim()) throw new DemoError('name is required', 400)
        const price = Number(body.price)
        if (!Number.isFinite(price) || price < 0) throw new DemoError('price must be a non-negative number', 400)
        const option = {
          id: nextId('option'),
          category: body.category,
          name: String(body.name).trim(),
          description: body.description ? String(body.description).trim() : null,
          price: price.toFixed(2),
        }
        db.options.push(option)
        persist()
        return { option: optionJson(option) }
      }
      if (third && method === 'PATCH') {
        const option = db.options.find((row) => row.id === Number(third))
        if (!option) throw new DemoError('Option not found', 404)
        if (body.name !== undefined) option.name = String(body.name).trim()
        if (body.description !== undefined) option.description = body.description
        if (body.price !== undefined) option.price = Number(body.price).toFixed(2)
        persist()
        return { option: optionJson(option) }
      }
      if (third && method === 'DELETE') {
        const index = db.options.findIndex((row) => row.id === Number(third))
        if (index === -1) throw new DemoError('Option not found', 404)
        db.options.splice(index, 1)
        persist()
        return { ok: true }
      }
    }

    if (second === 'destinations' && method === 'GET') {
      const counts = new Map()
      for (const journey of db.journeys) {
        if (!journey.destination) continue
        counts.set(journey.destination, (counts.get(journey.destination) || 0) + 1)
      }
      return {
        destinations: [...counts.entries()]
          .map(([destination, journey_count]) => ({ destination, journey_count }))
          .sort((a, b) => a.destination.localeCompare(b.destination)),
      }
    }
  }

  throw new DemoError('Not found', 404)
}
