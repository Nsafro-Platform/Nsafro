// Wizard state, step lists, validation and payload building for the multi-type
// reservation module. Prices are never computed here — the backend does that and
// the wizard only displays what /api/reservations/quote returns.

export const RESERVATION_TYPE_OPTIONS = [
  {
    id: 'PERSONAL',
    title: 'Personal reservation',
    badge: 'Individual',
    text: 'Pick your scale/degree and transport mode for an individual trip.',
    flow: 'Scale & preferences → Transport → Review → Payment',
  },
  {
    id: 'GROUP',
    title: 'Group journey',
    badge: 'Pre-designed',
    text: 'Join a pre-organized group journey with a published program and seats.',
    flow: 'Journey → Experience & media → Participants → Payment',
  },
  {
    id: 'CUSTOM',
    title: 'Fully personalized trip',
    badge: 'Custom',
    text: 'Build your own itinerary: destinations, party size and custom transport.',
    flow: 'Itinerary → Party → Transport → Quote & review → Payment',
  },
]

// Shown before a type is picked (devision.md §3.1 stepper shape).
export const GENERIC_STEPS = [
  { id: 'type', label: 'Type' },
  { id: 'details', label: 'Details' },
  { id: 'media', label: 'Transport / Media' },
  { id: 'summary', label: 'Summary & Payment' },
]

export const STEP_LISTS = {
  PERSONAL: [
    { id: 'type', label: 'Type' },
    { id: 'preferences', label: 'Preferences & Scale' },
    { id: 'transport', label: 'Transport' },
    { id: 'review', label: 'Review' },
    { id: 'payment', label: 'Payment Gateway' },
  ],
  GROUP: [
    { id: 'type', label: 'Type' },
    { id: 'journey', label: 'Group Journey' },
    { id: 'experience', label: 'Journey Experience' },
    { id: 'participants', label: 'Participants' },
    { id: 'payment', label: 'Payment Gateway' },
  ],
  CUSTOM: [
    { id: 'type', label: 'Type' },
    { id: 'plan', label: 'Destination & Itinerary' },
    { id: 'party', label: 'Party Details' },
    { id: 'transport', label: 'Custom Transport' },
    { id: 'review', label: 'Quote & Review' },
    { id: 'payment', label: 'Payment Gateway' },
  ],
}

export const PARTY_LABELS = {
  family: 'Family package',
  friends: 'Friends group',
  colleagues: 'Colleagues / team',
  solo: 'Solo traveller',
}

export const PAYMENT_METHODS = [
  {
    id: 'card',
    title: 'Credit / debit card',
    text: 'Standard card checkout. This demo uses the simulated gateway.',
  },
  {
    id: 'wallet',
    title: 'Digital wallet / instant payment',
    text: 'Apple Pay, Google Pay and instant bank transfers. Also simulated here.',
  },
]

export function stepsFor(type) {
  return type ? STEP_LISTS[type] : GENERIC_STEPS
}

export function initialReservation() {
  return {
    type: null,
    // PERSONAL
    tier: 'standard',
    travellers: 1,
    preferences: { comfort: '', schedule: '' },
    // PERSONAL + GROUP
    journeyId: null,
    // GROUP
    participantNames: [''],
    // CUSTOM
    destinations: [],
    stopoverOptionIds: [],
    partyType: 'family',
    members: 2,
    // PERSONAL + CUSTOM
    transportOptionId: null,
    // Payment gateway
    paymentMethod: 'card',
  }
}

export function journeyById(catalog, id) {
  if (!catalog || !id) return null
  return catalog.journeys.find((j) => j.id === id) || null
}

export function optionsByCategory(catalog, category) {
  if (!catalog) return []
  return catalog.options.filter((o) => o.category === category)
}

export function optionById(catalog, id) {
  if (!catalog || !id) return null
  return catalog.options.find((o) => o.id === id) || null
}

// The configuration the backend prices. Returns null while the configuration is
// still incomplete, so the wizard never sends a half-filled payload.
export function buildPayload(state) {
  if (state.type === 'PERSONAL') {
    if (!state.journeyId || !state.transportOptionId) return null
    return {
      reservationType: 'PERSONAL',
      journeyId: state.journeyId,
      tier: state.tier,
      transportOptionId: state.transportOptionId,
      travellersCount: state.travellers,
      preferences: { ...state.preferences },
    }
  }
  if (state.type === 'GROUP') {
    if (!state.journeyId) return null
    return {
      reservationType: 'GROUP',
      journeyId: state.journeyId,
      travellersCount: state.travellers,
    }
  }
  if (state.type === 'CUSTOM') {
    if (!state.destinations.length || !state.transportOptionId) return null
    return {
      reservationType: 'CUSTOM',
      destinations: state.destinations,
      stopoverOptionIds: state.stopoverOptionIds,
      transportOptionId: state.transportOptionId,
      members: state.members,
      partyType: state.partyType,
    }
  }
  return null
}

// The create request adds the participant list the GROUP flow collects.
export function buildCreatePayload(state) {
  const base = buildPayload(state)
  if (!base) return null
  if (base.reservationType === 'GROUP') {
    return {
      ...base,
      participants: state.participantNames
        .map((name) => name.trim())
        .filter(Boolean)
        .map((fullName) => ({ fullName })),
    }
  }
  return base
}

export function validateStep(stepId, state, catalog) {
  switch (stepId) {
    case 'type':
      return state.type ? null : 'Choose a reservation type to continue.'
    case 'preferences':
      if (!state.journeyId) return 'Select the journey you want to reserve.'
      if (state.travellers < 1) return 'Enter at least one traveller.'
      return null
    case 'transport':
      return state.transportOptionId ? null : 'Select a transport mode to continue.'
    case 'journey':
      return state.journeyId ? null : 'Select a group journey to continue.'
    case 'experience': {
      const journey = journeyById(catalog, state.journeyId)
      if (!journey) return 'Select a group journey to continue.'
      if (state.travellers > journey.remainingSeats) {
        return `Only ${journey.remainingSeats} seat(s) left on this journey.`
      }
      return null
    }
    case 'participants': {
      const journey = journeyById(catalog, state.journeyId)
      if (!journey) return 'Select a group journey to continue.'
      if (!state.travellers || state.travellers < 1) {
        return 'Choose how many seats you are reserving.'
      }
      if (state.travellers > journey.remainingSeats) {
        return `Only ${journey.remainingSeats} seat(s) left on this journey.`
      }
      if (state.participantNames.some((name) => !name.trim())) {
        return 'Enter the full name of every participant.'
      }
      return null
    }
    case 'plan':
      if (!state.destinations.length) return 'Select at least one destination.'
      return null
    case 'party':
      if (!state.members || state.members < 1 || state.members > 30) {
        return 'Enter a party size between 1 and 30.'
      }
      return null
    default:
      return null
  }
}

// Plain-language summary of the current choices, shown in the sidebar.
export function summaryRows(state, catalog) {
  const rows = []
  if (!state.type) return rows
  rows.push({ label: 'Reservation', value: state.type })

  if (state.type === 'PERSONAL' || state.type === 'GROUP') {
    const journey = journeyById(catalog, state.journeyId)
    if (journey) rows.push({ label: 'Journey', value: journey.title })
  }
  if (state.type === 'PERSONAL') {
    const tier = catalog?.serviceTiers.find((t) => t.id === state.tier)
    rows.push({ label: 'Scale / degree', value: tier ? `${tier.label} (×${tier.multiplier})` : state.tier })
    if (state.preferences.comfort) {
      rows.push({ label: 'Comfort', value: state.preferences.comfort })
    }
    if (state.preferences.schedule) {
      rows.push({ label: 'Schedule', value: state.preferences.schedule })
    }
  }
  if (state.type === 'CUSTOM') {
    rows.push({
      label: 'Destinations',
      value: state.destinations.length ? state.destinations.join(', ') : 'Not selected',
    })
    const stopovers = state.stopoverOptionIds
      .map((id) => optionById(catalog, id))
      .filter(Boolean)
      .map((o) => o.name)
    rows.push({
      label: 'Stopovers',
      value: stopovers.length ? stopovers.join(', ') : 'None selected',
    })
    rows.push({
      label: 'Party',
      value: `${PARTY_LABELS[state.partyType] || state.partyType} · ${state.members} member(s)`,
    })
  }
  if (state.type === 'PERSONAL' || state.type === 'CUSTOM') {
    const transport = optionById(catalog, state.transportOptionId)
    rows.push({
      label: 'Transport',
      value: transport ? transport.name : 'Not selected',
    })
  }
  if (state.type === 'PERSONAL') rows.push({ label: 'Travellers', value: String(state.travellers) })
  if (state.type === 'GROUP') rows.push({ label: 'Participants', value: String(state.travellers) })
  return rows
}
