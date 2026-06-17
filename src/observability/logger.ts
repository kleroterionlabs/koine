// src/observability/logger.ts — structured pino logger with credential redaction. Each tool passes its
// own level + service name; a run-scoped child carries the runId.
import pino, { type Logger } from "pino";

export type { Logger };

export interface LoggerOptions {
  level?: string;
  service?: string;
  runId?: string;
}

export function createLogger(opts: LoggerOptions = {}): Logger {
  const base = pino({
    level: opts.level ?? "info",
    redact: {
      paths: ["token", "privateKey", "*.token", "*.privateKey", "headers.authorization"],
      censor: "[redacted]",
    },
  });
  const bindings: Record<string, string> = {};
  if (opts.service) bindings.service = opts.service;
  if (opts.runId) bindings.runId = opts.runId;
  return Object.keys(bindings).length ? base.child(bindings) : base;
}
