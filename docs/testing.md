# Testing

- Unit/Integration: `pnpm test`
- E2E (Playwright): `pnpm e2e`

## Deterministic Data
- Ensure seeds include known category/product for E2E.

## Quick Auth Test
1. Signup (redirects to `/auth/verify-email?email=...`).
2. Click the verification link (lands on `/auth/login?verified=1&email=...`).
3. Login and verify you land on `/dashboard/user` or `/dashboard/admin`.
4. Confirm the header shows your avatar (not Login/Register).
