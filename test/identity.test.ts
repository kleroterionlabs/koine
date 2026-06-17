import { describe, expect, it } from "vitest";
import {
  bouleId,
  contentHash,
  idLabel,
  parseBouleBlock,
  parseVerifies,
  stripBouleBlock,
  withBouleBlock,
} from "../src/identity.js";

describe("bouleId", () => {
  it("is a deterministic kind:slug (same input ⇒ same id)", () => {
    expect(bouleId("design", "CI Health Dashboard!")).toBe("design:ci-health-dashboard");
    expect(bouleId("task", "Workflow  Run — Fetching")).toBe(bouleId("task", "Workflow Run Fetching"));
  });
});

describe("contentHash", () => {
  it("ignores the boule block and trailing whitespace", () => {
    const a = "body text";
    const b = `body text   \n\n${withBouleBlock("body text", { kind: "task", bouleId: "task:x" }).split("\n\n")[1]}`;
    expect(contentHash(a)).toBe(contentHash(b));
  });
});

describe("idLabel", () => {
  it("is deterministic, namespaced, within GitHub's 50-char limit", () => {
    expect(idLabel("design:foo")).toBe(idLabel("design:foo"));
    expect(idLabel("design:foo")).not.toBe(idLabel("design:bar"));
    expect(idLabel("design:foo").startsWith("boule-id-")).toBe(true);
    expect(idLabel("design:foo").length).toBeLessThanOrEqual(50);
  });
});

describe("withBouleBlock / parseBouleBlock round-trip", () => {
  it("appends a parseable block and recomputes the hash", () => {
    const body = withBouleBlock("# Task\nbody", {
      kind: "task",
      bouleId: "task:foo",
      parent: "feature:bar",
      generatedBy: "boule",
    });
    const block = parseBouleBlock(body);
    expect(block).toMatchObject({ kind: "task", bouleId: "task:foo", parent: "feature:bar" });
    expect(block?.contentHash).toBe(contentHash("# Task\nbody"));
    expect(stripBouleBlock(body).trim()).toBe("# Task\nbody");
  });

  it("returns null for a non-Boule body", () => {
    expect(parseBouleBlock("just an issue")).toBeNull();
  });
});

describe("parseVerifies", () => {
  it("pulls requirement numbers from the link line", () => {
    expect(parseVerifies("x\nVerifies: #110, #112\ny")).toEqual([110, 112]);
    expect(parseVerifies("none")).toEqual([]);
  });
});
