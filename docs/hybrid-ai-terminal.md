# Android → Termux → GitHub Codespaces → Codex Cloud → GitHub Actions

**Purpose:** Keep Android RAM use low, use ChatGPT Plus Codex within the subscription's usage limits, and avoid additional OpenAI API charges. All code edits must go through a reviewable branch/PR. No production deployment.

## Architecture

- **Termux on Android:** `git`, `gh`, and `openssh` only. No local LLM or full Ubuntu required for the primary workflow.
- **Codespaces:** Optional remote Linux terminal; choose a 2-core machine, 5-minute idle timeout, private ports. The devcontainer does **not** auto-install dependencies.
- **Codex Cloud (ChatGPT):** Connect this GitHub repo in the Codex web UI, create and publish its cloud environment, then start coding tasks on web or supported mobile UI. It is a **separate cloud environment**, not the same VM as Codespaces.
- **GitHub Actions:** Read-only metadata/security sanity checks. `pull_request`, manual, and weekly schedule. No API key, external AI API, Firebase, or deployment. Weekly schedules only take effect on the default branch after merge.

## Android Termux (run in real Termux, not in an Ubuntu PRoot session)

```sh
pkg update
pkg install git gh openssh -y
gh auth login -h github.com -p https --web
gh auth status
gh codespace list
```

Authorize in the browser yourself. Never paste tokens, passwords or OTPs in chat.

Create Codespace from the setup PR branch (you can also open GitHub → select the branch → **Code → Codespaces**):

```sh
gh codespace create -R inbox6090/Union-Parishad-Certificate- -b chore/hybrid-cloud-terminal-2026-10-30 --idle-timeout 5m
gh codespace list
gh codespace ssh
gh codespace stop
```

**Note:** This branch includes the proposed devcontainer before it is merged. Once the setup PR is reviewed and merged, future Codespaces can be created from `main`. For separate feature work, use a new branch (`git switch -c feature/my-task`). If the CLI cannot start a Codespace for your account, use GitHub's browser UI and check account access/quotas. Exiting an SSH session is not the same as stopping a Codespace.

## In the remote Linux terminal (optional)

```sh
node --version
npm --version
git status --short
npm install --ignore-scripts --no-audit --no-fund
npm run lint
npm run build
```

The repository currently has **no lockfile**; do not pretend `npm ci` will succeed. Dependency installation can change resolution between runs; inspect before committing any generated lockfile. If builds need environment variables, use dummy/test values only and never upload real credentials or citizen data.

## Codex Cloud

1. Open https://chatgpt.com/codex (or the current Codex entry point), log in with the **same ChatGPT Plus account**, and authorize the relevant GitHub repository when prompted.
2. In Codex Cloud on web/desktop, configure/publish an environment for `inbox6090/Union-Parishad-Certificate-` after reviewing setup scripts and network/credential access.
3. Start a task: “Audit the repo on a new branch. Use only test/demo data. Run applicable checks. Do not deploy, change production Firestore rules or merge; present a diff and PR for review.”
4. Review changes/test results and merge only after human approval. Codex Cloud and Codespaces sync **through Git branches/PRs**, not automatically through a shared live terminal.

**Billing:** Sign in to Codex via ChatGPT subscription; **do not** configure `OPENAI_API_KEY` or add API-paid agents to GitHub Actions. Codex Plus and cloud usage are rate-limited and subject to account eligibility. Avoid purchasing credits and paid upgrades. Do not assume unrestricted free use.

## GitHub Actions

- Workflow `.github/workflows/hybrid-safety-check.yml` uses `permissions: contents: read`, a standard Ubuntu runner, and a short timeout.
- Runs on PRs affecting config/safety files, manual `workflow_dispatch`, and weekly after merge to default branch.
- Validates JSON files, rejects tracked real dotenv files, and warns about risky Firestore rule patterns. **This is not a full secret scan, typecheck, vulnerability scan, nor Firestore security certification.**
- In your GitHub repository Settings → Actions → General, use restricted token permissions.

## Cost guardrails

1. Open https://github.com/settings/billing and configure budget/alerts for **Codespaces** and **Actions**. Enable **Stop usage when budget limit is reached** where available; check actual limits in your account. Enable included-usage warning emails.
2. In https://github.com/settings/codespaces set default idle timeout to **5 minutes**; pick **2 cores** (when offered). **Stop** Codespaces when you finish. Storage can remain counted while stopped.
3. Avoid larger runners, prebuilds, public forwarded ports, paid Copilot extras, and automated AI/API calls.
4. Keep public repo free of private certificates, NID, phone numbers, `.env` and cloud credentials. `.env.example` placeholders only. Use least-privilege secrets management in private development and no production data in cloud tests.
5. `firestore.rules` was previously flagged as broadly permissive. **Do not deploy existing rules** until security tests and human review are complete. This workflow only warns and cannot fix them.

## Success checks

- Termux: `gh auth status` shows GitHub login; `gh codespace list` works.
- Codespace: `node --version`, `git status --short` work; you can stop it.
- Codex Cloud: published environment can read repo and propose a diff/PR.
- GitHub Actions: the new workflow reports success or documented warnings when manually run; no deployment is performed.
