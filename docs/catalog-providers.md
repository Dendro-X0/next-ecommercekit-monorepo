# Catalog Providers

This project supports a switchable catalog backend via an adapter interface.

## Overview

The active catalog provider is controlled by:

- `CATALOG_PROVIDER=native | shopify | medusa`

Behavior:

- `native` uses the local Postgres database (Drizzle) and supports full CRUD.
- `shopify` and `medusa` are **read-only** in this starterkit.
  - The shop and admin can browse products and categories.
  - Product create/edit/delete is blocked at the API layer.
  - The admin UI switches to a read-only mode (banner + disabled actions).

## Admin meta endpoint

The admin dashboard detects read-only mode via:

- `GET /api/v1/admin/catalog-meta`

Response:

```json
{
  "provider": "shopify",
  "supportsWrite": false,
  "supportsCategoryProductCounts": true
}
```

The UI uses this to:

- show a global "Read-only catalog provider" banner
- disable product create/edit/duplicate/delete UI flows
- redirect direct navigation to product create/edit pages back to the products list

## Provider-specific environment variables

### Native

No additional variables.

### Shopify

Required:

```bash
CATALOG_PROVIDER=shopify
SHOPIFY_STOREFRONT_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=...
```

Optional:

```bash
SHOPIFY_API_VERSION=
```

Notes:

- This adapter uses the **Shopify Storefront GraphQL API**.
- `SHOPIFY_API_VERSION` is optional; when unset, the provider uses its default.

### Medusa

Required:

```bash
CATALOG_PROVIDER=medusa
MEDUSA_BACKEND_URL=https://your-medusa-backend.example
MEDUSA_ADMIN_API_KEY=...
```

## Related docs

- [Architecture](./architecture.md)
- [Environment Setup](../ENV_SETUP.md)
