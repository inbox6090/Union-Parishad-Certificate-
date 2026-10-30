# Security CI review checklist (draft, not a deploy instruction)

This PR introduces four **unfiltered** pull-request jobs, so required checks can have stable names.
- **TypeScript, application tests and build:** npm ci (scripts disabled), tsc, Node security utility tests and Vite/Express build.
- **ESLint security patterns:** detects debugger/eval/new Function in TypeScript/TSX and test files. This is a narrow security lint, **not** a comprehensive style or type-aware lint setup. Isolated pinned direct packages currently lack a transitive lockfile.
- **Dependency audit (high and critical):** npm registry network advisory check for production packages. Existing vulnerabilities may make this job red; do not bypass it without triage.
- **Firestore deny-by-default policy guard:** deliberately FAILS against the legacy main rules with `|| true`. It should pass only after a separately reviewed Firestore security remediation. This static guard does not replace Firebase Emulator tests.

To enforce *required* checks, the GitHub repository administrator must configure branch protection/rulesets for `main` and require these four exact job names **after** they have run. Inspect the PR check names in GitHub settings first. The API connection currently cannot read or change branch protection (403), so settings are NOT changed here.

The ongoing [Firestore remediation PR #5](https://github.com/inbox6090/Union-Parishad-Certificate-/pull/5) has an independent Emulator test job. Firestore rules on main are still unsafe; main is NOT production safe.
**No merge/deploy/production access; keep as Draft until all required gates and upstream fixes pass.**
