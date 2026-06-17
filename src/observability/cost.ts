// src/observability/cost.ts — folds SDK result cost/usage into per-model totals. Estimate-only.
export interface ModelUsage {
  inputTokens?: number;
  outputTokens?: number;
  costUSD?: number;
}

export interface ModelTotals {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export class CostMeter {
  totalUsd = 0;
  private models: Record<string, ModelTotals> = {};

  /** Fold one result message's totals into the meter. */
  record(totalCostUsd: number, modelUsage: Record<string, ModelUsage>): void {
    this.totalUsd += totalCostUsd;
    for (const [model, u] of Object.entries(modelUsage)) {
      const acc = this.models[model] ?? { inputTokens: 0, outputTokens: 0, costUsd: 0 };
      acc.inputTokens += u.inputTokens ?? 0;
      acc.outputTokens += u.outputTokens ?? 0;
      acc.costUsd += u.costUSD ?? 0;
      this.models[model] = acc;
    }
  }

  byModel(): Record<string, ModelTotals> {
    return this.models;
  }
}
