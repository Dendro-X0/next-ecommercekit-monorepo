# Security Policy

## Supported Versions

Only the latest main branch is actively maintained prior to 1.0.

## Reporting a Vulnerability

Please do not open public issues for security vulnerabilities.

1. Email the maintainer with details and a proof of concept.
2. Expect an acknowledgement within 72 hours.
3. A fix or mitigation plan will be proposed within 14 days.
4. Coordinated disclosure is preferred; we’ll credit reporters unless requested otherwise.

## Scope

- Server routes under `apps/web/src/app/api/*` (Hono)
- Packages in `packages/api`, `packages/db`, `packages/auth`, `packages/mail`, `packages/ui`

## Best Practices in This Repo

- Env validation using `@t3-oss/env-nextjs` + `zod`
- Rate limiting and request correlation in API
- Typed DTOs with Zod validation on input, structured error envelopes
- Session handling via Better Auth with secure cookies in production
