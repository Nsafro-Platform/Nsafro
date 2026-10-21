import crypto from 'node:crypto';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (message = 'Invalid request') => new HttpError(400, message);
export const unauthorized = (message = 'Authentication required') => new HttpError(401, message);
export const forbidden = (message = 'Not allowed') => new HttpError(403, message);
export const notFound = (message = 'Not found') => new HttpError(404, message);
export const conflict = (message = 'Conflict') => new HttpError(409, message);

export function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function isNonEmptyString(value, maxLength = 500) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

export function isPositiveInt(value) {
  return Number.isInteger(value) && value > 0;
}

export function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  // Reject impossible days (2026-02-31) that Date.parse silently rolls over to
  // March: such a value reaches Postgres as an invalid date and raises a 500.
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Exact money math using integer cents to avoid floating point drift.
export function toCents(decimalString) {
  return Math.round(Number(decimalString) * 100);
}

export function centsToDecimalString(cents) {
  return (cents / 100).toFixed(2);
}

function randomReferenceBody() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(8);
  let ref = '';
  for (const b of bytes) ref += alphabet[b % alphabet.length];
  return ref;
}

export function newBookingReference() {
  return `JRN-${randomReferenceBody()}`;
}

export function newReservationReference() {
  return `RSV-${randomReferenceBody()}`;
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
