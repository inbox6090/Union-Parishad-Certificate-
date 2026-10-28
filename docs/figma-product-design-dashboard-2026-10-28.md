# UI/UX Redesign — 28 October 2026

## Design source
- Figma: https://www.figma.com/design/pjl9EvSRW7qcCr1X4Qa5m5
- Frame: `1:2` (Baheratail Dashboard — Desktop)
- Design system: Simple Design System; reusable Button and Stats Card instances.

## Product Design brief
Target: React/TypeScript union parishad certificate home dashboard and citizen search.
User goal: clear and responsive Bangla-first service navigation with meaningful empty/loading/error states and truthful administration data.
Audience: Union Parishad operators and authorized administrators.
Style: emerald and neutral, light surfaces, accessible contrast, compact navigation and calm information hierarchy.

## Implemented
- Removed built-in fictitious citizen records from HomePanel search. Search now only uses records stored on the current device.
- Removed invented statistics, monthly trends and categorical/ward counts used as defaults.
- Added server loading/ready/unavailable status and preserved genuine zero values using explicit finite-number checks.
- Added missing-data chart messaging and accessible search label.
- Removed unverified claims about accuracy, growth percentages and invented performance.

## Follow-up before production
1. Confirm backend `/api/admin/stats` is protected by an authenticated, authorized session; avoid exposing operational records in a public route.
2. Integrate role-based search against a secured data source only after defining consent and access rules; localStorage is not a secure citizen database.
3. Validate the dashboard on mobile widths and run `npm run lint`, `npm run build`, and end-to-end tests in CI.
4. Replace open Firestore security rules with verified role-based policies, test in a staging environment and obtain deployment approval.
5. Review the formal title of the designated approval officer before changing operational records.

Production website and `main` branch are intentionally unchanged.
