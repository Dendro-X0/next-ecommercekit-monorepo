/**
 * Single export for the Hono app.
 */
export { type AppType, app } from "./app"
export { default as paymentsPaypalRoute } from "./routes/payments-paypal"
// Also export focused route modules so Next.js can mount them in separate
// route handlers to reduce serverless bundle size.
export { default as paymentsStripeRoute } from "./routes/payments-stripe"
