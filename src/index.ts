// src/index.ts — the public surface of @kleroterion/koine, the common tongue of Boule & Praktor.

// Domain contract
export type { ArtifactKind, Fingerprint } from "./types.js";
export * from "./taxonomy.js";
export * from "./identity.js";

// Security (outbound scrubbing)
export { scrubSecrets, type ScrubResult } from "./security/secrets.js";
export { sanitizeMentions, type MentionResult } from "./security/mentions.js";
export { cleanOutbound, type Outbound } from "./security/outbound.js";

// GitHub transport
export {
  type GitHubAuth,
  type AuthConfig,
  mintToken,
  decodePrivateKey,
} from "./github/auth.js";
export {
  type GitHubClient,
  type ClientOptions,
  createGitHubClient,
} from "./github/client.js";

// Claude Agent SDK run-loop
export {
  type StopReason,
  type RunOutcome,
  type RunHooks,
  runQuery,
} from "./agent/run.js";

// Observability
export { type Logger, type LoggerOptions, createLogger } from "./observability/logger.js";
