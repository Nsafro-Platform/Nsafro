import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'dev-local-secret-do-not-use-in-production',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  cookieMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
  // Optional: enables Google sign-in (Google Identity Services ID-token flow)
  // when the OAuth Web-Client ID is provided. Empty = feature hidden/disabled.
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
};
