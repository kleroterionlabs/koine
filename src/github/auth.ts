// src/github/auth.ts — credential TYPES + token minting only. Each tool resolves its OWN env names
// into an AuthConfig (Boule uses BOULE_APP_*, Praktor uses PRAKTOR_APP_*) and passes it to the client;
// koine never reads process.env, so it stays identity-agnostic.
import { createAppAuth } from "@octokit/auth-app";

export type GitHubAuth =
  | { kind: "pat"; token: string }
  | { kind: "app"; appId: string; installationId: string; privateKey: string };

export interface AuthConfig {
  github: GitHubAuth;
}

/** Decode a base64-or-PEM private key (CI usually stores a single-line base64 blob). */
export function decodePrivateKey(raw: string): string {
  const v = raw.trim();
  if (v.includes("BEGIN") && v.includes("PRIVATE KEY")) return v;
  try {
    return Buffer.from(v, "base64").toString("utf8");
  } catch {
    return v;
  }
}

/** Mint a usable token: a PAT passes through; an App mints a short-lived installation token. */
export async function mintToken(auth: GitHubAuth): Promise<string> {
  if (auth.kind === "pat") return auth.token;
  const appAuth = createAppAuth({
    appId: auth.appId,
    privateKey: auth.privateKey,
    installationId: Number(auth.installationId),
  });
  const { token } = await appAuth({ type: "installation" });
  return token;
}
