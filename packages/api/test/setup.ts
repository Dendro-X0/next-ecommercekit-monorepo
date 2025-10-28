/**
 * Vitest setup for API package.
 * Sets required environment variables so env validation passes in tests.
 */
process.env.WEB_ORIGIN = process.env.WEB_ORIGIN || "http://localhost:3000"
process.env.ADMIN_EMAILS = process.env.ADMIN_EMAILS || "admin@example.com"
process.env.AFFILIATE_COMMISSION_PCT = process.env.AFFILIATE_COMMISSION_PCT || "10"
