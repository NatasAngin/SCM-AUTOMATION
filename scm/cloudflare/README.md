# SCM Automation — Cloudflare migration

This directory is the isolated Cloudflare implementation. The original PHP/XAMPP application remains in `../` and is intentionally not modified by the migration.

## Architecture

- Cloudflare Workers: authenticated API and application routing.
- Cloudflare D1: SQLite-compatible relational data store.
- Cloudflare R2: uploaded procurement documents and generated files.
- Workers Static Assets: browser application in `public/`.
- Workers AI: optional AI integration, enabled only after an AI binding is configured.

## Current migration scope

The first migration foundation includes:
- Worker API entry point and health endpoint.
- Secure password hashing (PBKDF2-SHA-256) and signed, HttpOnly session cookie.
- One-time administrator bootstrap endpoint.
- D1 schema for users, vendors, sourcing requests, KAK, draft contracts, contracts, obligations, change orders, approvals and vendor performance.
- Authenticated CRUD API for those business modules.
- R2 upload/download API for documents.
- Responsive browser UI for login, dashboard and the business registers.

The PHP implementation remains the reference for business rules and document structure. The browser print view is an interim PDF route; DOCX generation using the PT BAI reference template is a later migration milestone and must be validated against the original template before it replaces the PHP exporter. Do not delete or overwrite the PHP app during this work.

## Cloudflare resources

Create these resources in the same Cloudflare account as the Worker:

1. D1 database named `scm-automation-db`.
2. R2 bucket named `scm-automation-documents`.

Then copy the D1 database UUID into `wrangler.jsonc` in the `database_id` field. Keep the binding names `DB` and `DOCUMENTS` unchanged.

## Local development

Requirements: Node.js LTS and npm.

From this directory:

```bash
npm install
npx wrangler login
npx wrangler d1 create scm-automation-db
npx wrangler r2 bucket create scm-automation-documents
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

Use long, randomly generated values. Deploy the Worker only after D1 and R2 bindings exist.

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
- [ ] Provision D1 and R2 resources in Cloudflare.
- [ ] Apply D1 migrations and run API smoke tests.
- [ ] Complete KAK form parity, approval lifecycle and contract workflows.
- [ ] Port all remaining modules and role/permission rules.
- [ ] Implement DOCX export compatible with the PT BAI reference template.
- [ ] Validate PDF/print output, uploads and document retention.
- [ ] Migrate existing MySQL data after backup and reconciliation.
- [ ] Security review, UAT and production cutover plan.
