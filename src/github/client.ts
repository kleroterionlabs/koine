// src/github/client.ts — THE only path to the GitHub API. All backoff/retry + auth live here so both
// tools share one hardened transport. Reads are concurrency-friendly; writes serialize via p-retry.
import { graphql as octokitGraphql } from "@octokit/graphql";
import { throttling } from "@octokit/plugin-throttling";
import { Octokit } from "@octokit/rest";
import pRetry, { AbortError } from "p-retry";
import type { Logger } from "pino";
import { type AuthConfig, mintToken } from "./auth.js";

const ThrottledOctokit = Octokit.plugin(throttling);
type OpKind = "read" | "write";

export interface GitHubClient {
  rest: Octokit;
  /** Run a REST call through the retry/backoff gate. */
  withRest<T>(op: OpKind, fn: (o: Octokit) => Promise<T>): Promise<T>;
  /** Run a GraphQL document through the gate. */
  graphql<T = unknown>(op: OpKind, query: string, vars?: Record<string, unknown>): Promise<T>;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const jitter = (ms: number): number => ms * (0.5 + Math.random());

function classifyWait(err: unknown, attempt: number): number {
  const e = err as { status?: number; response?: { status?: number; headers?: Record<string, string> } };
  const status = e.status ?? e.response?.status;
  const headers = e.response?.headers ?? {};
  if (status === 403 || status === 429) {
    const ra = Number(headers["retry-after"]);
    if (Number.isFinite(ra)) return ra * 1000;
    const reset = Number(headers["x-ratelimit-reset"]);
    if (Number.isFinite(reset)) return Math.max(0, reset * 1000 - Date.now());
    return Math.max(60_000, jitter(2 ** attempt * 1000));
  }
  if (status && status >= 500) return jitter(2 ** attempt * 500);
  throw new AbortError(err as Error); // 4xx (non-rate) ⇒ don't retry
}

export interface ClientOptions {
  maxRetries?: number;
}

export async function createGitHubClient(
  auth: AuthConfig,
  log: Logger,
  opts: ClientOptions = {},
): Promise<GitHubClient> {
  const token = await mintToken(auth.github);
  const rest = new ThrottledOctokit({
    auth: token,
    throttle: {
      onRateLimit: (after, _o, _ok, retryCount) => {
        log.warn({ after, retryCount }, "primary rate limit");
        return retryCount < 3;
      },
      onSecondaryRateLimit: (after) => {
        log.warn({ after }, "secondary rate limit; honoring retry-after");
        return true;
      },
    },
  });
  const gql = octokitGraphql.defaults({
    headers: {
      authorization: `token ${token}`,
      "GraphQL-Features": "issue_types,sub_issues",
    },
  });

  const run = <T>(_op: OpKind, task: () => Promise<T>): Promise<T> =>
    pRetry(
      async (attempt) => {
        try {
          return await task();
        } catch (err) {
          await sleep(classifyWait(err, attempt));
          throw err;
        }
      },
      { retries: opts.maxRetries ?? 6, minTimeout: 1000, factor: 2 },
    );

  return {
    rest,
    withRest: (op, fn) => run(op, () => fn(rest)),
    graphql: <T>(op: OpKind, query: string, vars?: Record<string, unknown>) =>
      run<T>(op, () => gql(query, vars) as Promise<T>),
  };
}
