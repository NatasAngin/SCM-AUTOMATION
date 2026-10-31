# SCM Automation — Cloudflare migration

This directory is the isolated Cloudflare implementation. The original PHP/XAMPP application remains in `../` and is intentionally not modified by the migration.

## Architecture

- Cloudflare Workers: authenticated API and application routing.
- Cloudflare D1: SQLite-compatible relational data store.
- Workers Static Assets: browser application in `public/`.
- Workers AI: optional AI integration, enabled only after an AI binding is configured.

## Current migration scope

The first migration foundation includes:
- Worker API entry point and health endpoint.
- Secure password hashing (PBKDF2-SHA-256) and signed, HttpOnly session cookie.
- One-time administrator bootstrap endpoint.
- D1 schema for users, vendors, sourcing requests, KAK, draft contracts, contracts, obligations, change orders, approvals and vendor performance.
- Authenticated CRUD API for those business modules.
- Document attachment storage is intentionally deferred; no R2 binding is required for the Free-tier foundation.
- Responsive browser UI for login, dashboard and the business registers.

The PHP implementation remains the reference for business rules and document structure. The browser print view is an interim PDF route; DOCX generation using the PT BAI reference template is a later migration milestone and must be validated against the original template before it replaces the PHP exporter. Do not delete or overwrite the PHP app during this work.

## Cloudflare resources

Create these resources in the same Cloudflare account as the Worker:

1. D1 database named `scm-automation-db`.

No R2 bucket is required. Document uploads return a clear `501` response until a storage provider is added. Users can still create/print documents in the browser; persistent file attachments are deferred.

## Local development

Requirements: Node.js LTS and npm.

From this directory:

```bash
npm install
npx wrangler login
npx wrangler d1 create scm-automation-db
```

Copy the D1 UUID returned by Wrangler into `wrangler.jsonc`. Then apply the schema:

```bash
npm run db:local
npm run dev
```

For the remote D1 database, after checking the account and database binding:

```bash
npm run db:remote
```

## Required Worker secrets

Set secrets for the Worker (never commit these values):

```bash
npx wrangler secret put SESSION_SECRET
npx wrangler secret put BOOTSTRAP_TOKEN
```

Use long, randomly generated values. Deploy the Worker after the D1 binding exists.

After the first successful deployment, create the first administrator by sending a POST request to `/api/auth/bootstrap` with JSON:

```json
{
  "token": "the BOOTSTRAP_TOKEN secret",
  "username": "your-admin-username",
  "full_name": "SCM Administrator",
  "password": "a unique password of at least 12 characters"
}
```

Do not use the old XAMPP demo credential `admin/admin123` in production. Once the administrator is created, remove the `BOOTSTRAP_TOKEN` secret from Worker settings.

## Cloudflare Git build configuration

For the Git-connected Worker build:
- Production branch must remain `main` until the migration is reviewed and accepted.
- Use a preview/staging deployment sourced from `cloudflare-migration`.
- Set the build root directory to `scm/cloudflare`.
- Build/deploy command: `npm install && npm run deploy`.
- No static output directory is needed; Wrangler publishes the Worker and its `public/` assets.

Do not connect the migration branch to the production environment yet. Never merge this branch into `main` without an explicit review and approval.

## Migration checklist

- [x] Create isolated migration branch.
- [x] Add Cloudflare Worker project skeleton and D1 schema.
- [x] Add first API/authentication layer and application shell.
- [x] Provision D1 database in Cloudflare.
- [x] Remove mandatory R2 dependency for Free-tier deployment.
- [ ] Decide and implement a persistent document-storage option if file attachments are required.
- [ ] Apply D1 migrations and run API smoke tests.
- [ ] Complete KAK form parity, approval lifecycle and contract workflows.
- [ ] Port all remaining modules and role/permission rules.
- [ ] Implement DOCX export compatible with the PT BAI reference template.
- [ ] Validate PDF/print output, uploads and document retention.
- [ ] Migrate existing MySQL data after backup and reconciliation.
- [ ] Security review, UAT and production cutover plan.
