# Koine

> *The common tongue.* Shared building blocks for [Boule](https://github.com/kleroterionlabs/boule) and [Praktor](https://github.com/kleroterionlabs/praktor).

**Koine** (Greek κοινή, "the common [dialect]" — the shared standard Greek everyone spoke) is the library both Kleroterion tools depend on, so the contract between them can never drift. Boule writes the artifacts; Praktor reads them; **koine** is the single definition they share.

## What it provides

| Module | Exports |
|---|---|
| **taxonomy** | `ISSUE_TYPE_NAMES`, `kindLabel`, `STATUS_LABELS`, `PRIORITY_LABELS`, `OPERATIONAL_LABELS`, `PRAKTOR_LABELS`, `PROJECT_FIELDS`, `STATUS_OPTIONS`, `DISCUSSION_CATEGORIES`, `allBootstrapLabels()` — the GitHub label/field contract |
| **identity** | `bouleId`, `contentHash`, `idLabel`, `parseBouleBlock`/`renderBouleBlock`/`withBouleBlock`/`stripBouleBlock`, `parseVerifies` — the `boule:v1` block + content addressing |
| **github** | `createGitHubClient` (octokit + throttling + retry/backoff), `mintToken` (PAT or GitHub App), `AuthConfig`/`GitHubAuth` |
| **agent** | `runQuery` — the resilient Claude Agent SDK run-loop (survives subprocess teardown noise) |
| **security** | `cleanOutbound`, `scrubSecrets`, `sanitizeMentions` — redact credentials + neutralize @-mentions before anything reaches GitHub |
| **observability** | `createLogger` — structured pino logging with credential redaction |

## Design notes

- **Identity-agnostic.** koine never reads `process.env`. Each tool resolves its *own* credentials (Boule's App, Praktor's App) into an `AuthConfig` and passes it to `createGitHubClient`.
- **On-wire strings are stable.** Label values stay `boule:*` / `kind:*` / `status:*` — they're the format already on live GitHub issues. koine is their code home, not a rename.
- `@anthropic-ai/claude-agent-sdk` is a **peer dependency** — the consuming tool owns the version.

## Usage

```ts
import { createGitHubClient, parseBouleBlock, kindLabel, runQuery } from "@kleroterion/koine";
```

## License

MIT
