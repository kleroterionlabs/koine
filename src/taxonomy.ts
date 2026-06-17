// src/taxonomy.ts — THE shared label/field contract written to GitHub. Boule produces it; Praktor reads
// it; both import it here so it can never drift. The string VALUES are the on-wire format (already on
// live issues) — change them only with a migration.
import type { ArtifactKind } from "./types.js";

export const ISSUE_TYPE_NAMES = {
  design: "Design",
  requirement: "Requirement",
  competitor: "Competitor",
  market: "Market",
  gap: "Gap",
  epic: "Epic",
  feature: "Feature",
  task: "Task",
  spike: "Spike",
} as const;

/** Fallback kind label used when native Issue Types are unavailable. */
export const kindLabel = (kind: ArtifactKind): string => `kind:${kind}`;

export const OPERATIONAL_LABELS = {
  managed: "boule:managed",
  needsHuman: "boule:needs-human",
  superseded: "boule:superseded",
  /** Kill-switch: an OPEN issue carrying this label halts all autonomous writes. */
  halt: "boule:halt",
} as const;

/** An artifact's ACCEPTANCE lifecycle, carried on the Issue as a label. */
export const STATUS_LABELS = [
  "status:draft",
  "status:needs-review",
  "status:accepted",
  "status:superseded",
] as const;
export type StatusLabel = (typeof STATUS_LABELS)[number];

export const PRIORITY_LABELS = [
  "priority:must",
  "priority:should",
  "priority:could",
  "priority:wont",
] as const;

/** Praktor's own progress labels — namespaced so they never collide with Boule's lifecycle. */
export const PRAKTOR_LABELS = {
  inProgress: "praktor:in-progress",
  done: "praktor:done",
  blocked: "praktor:blocked",
} as const;

/** Projects v2 custom field names (canonical keys for field values). */
export const PROJECT_FIELDS = {
  status: "Status",
  kind: "Kind",
  priority: "Priority",
  rice: "RICE",
  wsjf: "WSJF",
  moscow: "MoSCoW",
  iteration: "Iteration",
} as const;

/** Projects v2 Status column options (the board workflow state). */
export const STATUS_OPTIONS = [
  "Triage",
  "In Design",
  "In Review",
  "Ready",
  "In Progress",
  "Blocked",
  "Done",
] as const;

export const DISCUSSION_CATEGORIES = {
  dailyStatus: "Daily Status",
  handoff: "Agent Handoffs",
  designReview: "Design Review",
} as const;

/** Every repo label the tools bootstrap (kinds + operational + status + priority). */
export function allBootstrapLabels(): string[] {
  const kinds = Object.keys(ISSUE_TYPE_NAMES) as ArtifactKind[];
  return [
    ...kinds.map(kindLabel),
    ...Object.values(OPERATIONAL_LABELS),
    ...STATUS_LABELS,
    ...PRIORITY_LABELS,
  ];
}
