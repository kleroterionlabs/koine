// src/types.ts — shared domain types used across the taxonomy + identity contract.

export type ArtifactKind =
  | "design"
  | "requirement"
  | "competitor"
  | "market"
  | "gap"
  | "epic"
  | "feature"
  | "task"
  | "spike";

/** Content-addressable fingerprint of an artifact body (e.g. "sha256:abcd1234..."). */
export type Fingerprint = string;
