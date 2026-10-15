// Server-side pricing rules for the multi-type reservation module.
//
// This is the single source of truth for reservation money: every amount is
// derived from database-stored prices/options here, in integer cents. Nothing in
// this file (or in the reservations route) trusts a client-sent price.

import { toCents, centsToDecimalString } from './util.js';

export const RESERVATION_TYPES = ['PERSONAL', 'GROUP', 'CUSTOM'];

// "Scale / degree (Echelle)" — the service tier chosen on the Personal flow.
// The multiplier applies to the journey's per-traveller price.
export const SERVICE_TIERS = [
  { id: 'standard', label: 'Standard', multiplier: 1, description: 'Standard service, shared transport.' },
  { id: 'comfort', label: 'Comfort', multiplier: 1.25, description: 'Extra legroom, slower pace, flexible hours.' },
  { id: 'premium', label: 'Premium', multiplier: 1.6, description: 'Priority departures and upgraded rooms.' },
  { id: 'luxury', label: 'Luxury', multiplier: 2, description: 'Private guide and top-tier accommodation.' },
];

export const SERVICE_TIER_IDS = SERVICE_TIERS.map((t) => t.id);

// Personal trip preferences are informational (they do not change the price).
export const COMFORT_PREFERENCES = ['Standard seat', 'Extra legroom', 'Front row'];
export const SCHEDULE_PREFERENCES = ['Early morning', 'Midday', 'Afternoon', 'Evening'];
export const PARTY_TYPES = ['family', 'friends', 'colleagues', 'solo'];

// Simulated checkout figures. Disclosed in the UI next to the totals.
export const TAX_RATE = 0.1;
export const SERVICE_FEE_CENTS = 2500; // MAD 25.00 flat checkout fee
export const CUSTOM_PLANNING_FEE_CENTS = 15000; // MAD 150.00 custom-trip planning fee

export function tierMultiplier(tierId) {
  const tier = SERVICE_TIERS.find((t) => t.id === tierId);
  return tier ? tier.multiplier : 1;
}

export function serviceTier(tierId) {
  return SERVICE_TIERS.find((t) => t.id === tierId) || SERVICE_TIERS[0];
}

// Subtotals are summed in cents, then tax and the checkout fee are added once.
export function finalizePricing(subtotalCents, lines) {
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const totalCents = subtotalCents + taxCents + SERVICE_FEE_CENTS;
  return {
    subtotal: centsToDecimalString(subtotalCents),
    taxes: centsToDecimalString(taxCents),
    fees: centsToDecimalString(SERVICE_FEE_CENTS),
    total: centsToDecimalString(totalCents),
    lines: [
      ...lines.map(({ label, detail, cents }) => ({ label, detail, amount: centsToDecimalString(cents) })),
      {
        label: 'Taxes',
        detail: `${TAX_RATE * 100}% on the subtotal`,
        amount: centsToDecimalString(taxCents),
      },
      {
        label: 'Service fee',
        detail: 'Flat simulated checkout fee',
        amount: centsToDecimalString(SERVICE_FEE_CENTS),
      },
    ],
  };
}

export { toCents, centsToDecimalString };
