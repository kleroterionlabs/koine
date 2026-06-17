// src/identity.ts — the boule:v1 identity block + content addressing. The crux of safe autonomy:
// pure, deterministic, network-free. Same logical work ⇒ same id ⇒ idempotent re-runs.
import { createHash } from "node:crypto";
import type { ArtifactKind, Fingerprint } from "./types.js";

const BOULE_BEGIN = "<!-- boule:v1";
const BOULE_END = "-->";

export interface BouleBlock {
  kind: ArtifactKind;
  bouleId: string;
  contentHash: Fingerprint;
  parent?: string;
  runId?: string;
  generatedBy?: string;
}

/** Stable, content-independent slug. Same natural key ⇒ same id (NOT random). */
export function bouleId(kind: ArtifactKind, naturalKey: string): string {
  const slug = naturalKey
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return `${kind}:${slug}`;
}

/** sha256 over the normalized semantic body, EXCLUDING any boule block. */
export function contentHash(body: string): Fingerprint {
  const normalized = stripBouleBlock(body)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .trim();
  const hex = createHash("sha256").update(normalized, "utf8").digest("hex");
  return `sha256:${hex.slice(0, 16)}`;
}

/** A unique, deterministic dedup label (hashed to stay under GitHub's 50-char label limit). */
export function idLabel(id: string): string {
  const hex = createHash("sha256").update(id, "utf8").digest("hex");
  return `boule-id-${hex.slice(0, 12)}`;
}

export function renderBouleBlock(b: BouleBlock): string {
  return [
    BOULE_BEGIN,
    `kind: ${b.kind}`,
    `boule-id: ${b.bouleId}`,
    `content-hash: ${b.contentHash}`,
    b.parent ? `parent: ${b.parent}` : "parent:",
    b.runId ? `run-id: ${b.runId}` : null,
    b.generatedBy ? `generated-by: ${b.generatedBy}` : null,
    BOULE_END,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
}

/** Append the block to a body, recomputing the hash over the body sans-block. */
export function withBouleBlock(body: string, meta: Omit<BouleBlock, "contentHash">): string {
  const clean = stripBouleBlock(body).trimEnd();
  const block = renderBouleBlock({ ...meta, contentHash: contentHash(clean) });
  return `${clean}\n\n${block}\n`;
}

export function parseBouleBlock(body: string): BouleBlock | null {
  const start = body.indexOf(BOULE_BEGIN);
  if (start === -1) return null;
  const end = body.indexOf(BOULE_END, start);
  if (end === -1) return null;
  const inner = body.slice(start + BOULE_BEGIN.length, end);
  const get = (k: string): string | undefined => {
    const m = inner.match(new RegExp(`^${k}:\\s*(.+)$`, "m"));
    return m?.[1]?.trim() || undefined;
  };
  const kind = get("kind") as ArtifactKind | undefined;
  const id = get("boule-id");
  const hash = get("content-hash");
  if (!kind || !id || !hash) return null;
  return {
    kind,
    bouleId: id,
    contentHash: hash,
    parent: get("parent"),
    runId: get("run-id"),
    generatedBy: get("generated-by"),
  };
}

export function stripBouleBlock(body: string): string {
  const start = body.indexOf(BOULE_BEGIN);
  if (start === -1) return body;
  const end = body.indexOf(BOULE_END, start);
  if (end === -1) return body;
  return body.slice(0, start) + body.slice(end + BOULE_END.length);
}

/** Requirement issue numbers referenced by a `Verifies: #110, #112` link line (Task → Requirement). */
export function parseVerifies(body: string): number[] {
  const m = body.match(/^\s*Verifies:\s*(.+)$/im);
  if (!m?.[1]) return [];
  return [...m[1].matchAll(/#(\d+)/g)].map((x) => Number(x[1])).filter((n) => Number.isInteger(n));
}
