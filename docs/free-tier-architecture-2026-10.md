# Zero-cost-first Cloudflare Pages + Firebase architecture

## Goal
Start with Cloudflare Pages free static hosting + Firebase Spark (Auth and Firestore) with no mandatory monthly subscription. **Not unlimited**. Avoid Firebase Storage/Functions and SMS verification without checking current billing requirements. All data must be permissioned by Firestore security rules and trusted Firebase Auth custom claims.

## Build and preview (not deployment)
- npm install
- npm run test:pages
- npm run lint
- npm test (run Firestore emulator tests separately)
- npm run build:pages
- Output directory: dist
- Cloudflare Pages build command: npm run build:pages
- Cloudflare Pages environment: Node.js 22; no server-side secrets in VITE_* variables
- SPA fallback: public/_redirects
- /api/* routes intentionally return HTTP 503 JSON. This prevents the old Express routes from silently returning HTML or appearing operational.

## Existing features and migration blockers
The project currently includes an ~80KB Express server.ts implementing API routes, in-memory certificate and webhook stores, authentication middleware and AI features. Static Pages hosting **does not execute** this server. Thus this branch is **not feature-parity-ready** for production. Keep the existing Node hosting for internal testing until every API is inventoried and migrated to trusted server endpoints, or explicitly disabled in UI. Public verification uses a separate Firestore QR projection but no trusted token issuer/revoker exists yet.

Potential privacy incident: server.ts includes a literal default API key. Treat it as compromised if ever used; rotate/revoke it on the real backend and remove hardcoded keys from all server responses. Do not store secrets in frontend source or public Cloudflare environment variables.

## Scalable roadmap
1. Inventory all frontend fetch('/api/...') calls and server endpoints; classify auth, secrets, PII, admin actions, and read-only public projections.
2. Keep static React UI on Pages and Firebase Auth/Firestore on Spark, subject to quotas and verified rules.
3. Migrate privileged approval, token issuance/revocation, and other trusted server operations to a verified backend (Cloudflare Workers free quota if suitable, otherwise approved alternative). Never expose Firebase Admin credentials in browser code or Git.
4. Replace in-memory server state with Firestore or other durable data only after migration tests.
5. Add Firebase emulator integration tests and Cloudflare preview smoke tests with synthetic data.
6. Reduce Firestore reads with paginated lists, query limits, debounced search, explicit listeners, and offline cache without caching PII in shared devices.
7. Track usage alerts and quotas; document rollback. Require explicit approval before any live deployment, custom-domain change, Firebase rules deployment, or data migration.

## Security release gate
Current Firestore security changes have not passed emulator tests. Existing legacy public API endpoints may expose private certificate data. This branch intentionally has no auto-deploy workflow or Cloudflare credentials. Do not connect production domains or real citizen data until security review and parity tests pass.
