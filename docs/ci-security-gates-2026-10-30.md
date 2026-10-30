# Security CI review checklist (draft, not a deploy instruction)

This PR introduces four **unfiltered** pull-request jobs, so required checks can have stable names.
- **TypeScript, application tests and build:** npm ci (scripts disabled), tsc, Node security utility tests and Vite/Express build.
- **ESLint security patterns:** detects debugger/eval/new Function in TypeScript/TSX and test files. This is a narrow security lint, **not** a comprehensive style or type-aware lint setup. Isolated pinned direct packages currently lack a transitive lockfile.
- **Dependency audit (high and critical):** npm registry network advisory check for production packages. Existing vulnerabilities may make this job red; do not bypass it without triage.
- **Firestore deny-by-default policy guard:** deliberately FAILS against the legacy main rules with `|| true`. It should pass only after a separately reviewed Firestore security remediation. This static guard does not replace Firebase Emulator tests.

To enforce *required* checks, the GitHub repository administrator must configure branch protection/rulesets for `main` and require these four exact job names **after** they have run. Inspect the PR check names in GitHub settings first. The API connection currently cannot read or change branch protection (403), so settings are NOT changed here.

PR #5 was merged independently on 2026-10-30. It introduced fail-closed rules into main, but **NOT** Express route authorization, Firebase claim provisioning or public QR migration. New [Draft PR #7](https://github.com/inbox6090/Union-Parishad-Certificate-/pull/7) contains token-format and always-on Emulator workflow follow-up. This security policy guard passes on the merged rules, but **main is NOT production safe**.
**No merge/deploy/production access; keep as Draft until all required gates and upstream fixes pass.**


## Actual first CI outcomes (2026-10-30)
- TypeScript, utility tests and Vite/Express build: PASS after correcting an overly specific test expectation about HTML encoding.
- ESLint security pattern scan: PASS (limited scope and rules only).
- Firestore static policy guard: initially RED on legacy main; PASS after PR #5 merged. It cannot replace Emulator tests.
- Production dependency audit: FAIL, 8 advisories (4 high, 4 moderate), including `@grpc/grpc-js` / Firebase chain. Do **not** apply `npm audit fix --force` without testing breaking upgrades.
- No branch-protection configuration change was possible through the connector. A green CI report alone does not block unauthorized merge.
