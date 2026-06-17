// src/agent/run.ts — the shared Claude Agent SDK run-loop. Resilient to transport noise: the SDK's
// subprocess can exit non-zero on teardown AFTER emitting a terminal result; that must not override a
// run whose outcome is already known. A failure BEFORE any result is real and reported as such.
import { type Options, query } from "@anthropic-ai/claude-agent-sdk";
import type { Logger } from "pino";
import { CostMeter, type ModelTotals, type ModelUsage } from "../observability/cost.js";

export type StopReason = "success" | "error_max_turns" | "error_max_budget_usd" | "error_during_execution";

export interface RunOutcome {
  ok: boolean;
  stopReason: StopReason;
  sessionId: string;
  numTurns: number;
  costUsd: number;
  /** Per-model token + cost totals aggregated across the run's result messages. */
  modelUsage: Record<string, ModelTotals>;
  errors: string[];
}

export interface RunHooks {
  log: Logger;
  /** Called once with the SDK session id (at init) — e.g. to checkpoint for resume. */
  onSession?: (sessionId: string) => void;
}

function stopReasonOf(subtype: string): StopReason {
  if (subtype === "success") return "success";
  if (subtype === "error_max_turns") return "error_max_turns";
  if (subtype === "error_max_budget_usd") return "error_max_budget_usd";
  return "error_during_execution";
}

/** Drive one query() to completion, returning a normalized outcome. Never throws on transport noise. */
export async function runQuery(prompt: string, options: Options, hooks: RunHooks): Promise<RunOutcome> {
  const { log } = hooks;
  const meter = new CostMeter();
  let stopReason: StopReason = "error_during_execution";
  let numTurns = 0;
  let sessionId = "";
  const errors: string[] = [];
  let gotResult = false;

  try {
    for await (const msg of query({ prompt, options })) {
      if (msg.type === "system" && msg.subtype === "init") {
        sessionId = msg.session_id;
        log.info({ sessionId }, "agent run started");
        hooks.onSession?.(sessionId);
      }
      if (msg.type === "result") {
        stopReason = stopReasonOf(msg.subtype);
        numTurns = msg.num_turns;
        meter.record(msg.total_cost_usd, (msg.modelUsage ?? {}) as Record<string, ModelUsage>);
        if (msg.subtype !== "success") errors.push(...(msg.errors ?? []));
        gotResult = true;
        log.info({ stopReason, costUsd: msg.total_cost_usd, numTurns }, "agent run finished");
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (gotResult) {
      log.warn({ err: message }, "agent transport error after result; keeping captured outcome");
    } else {
      log.error({ err: message }, "agent run failed before producing a result");
      errors.push(message);
      stopReason = "error_during_execution";
    }
  }

  return {
    ok: stopReason === "success",
    stopReason,
    sessionId,
    numTurns,
    costUsd: meter.totalUsd,
    modelUsage: meter.byModel(),
    errors,
  };
}
