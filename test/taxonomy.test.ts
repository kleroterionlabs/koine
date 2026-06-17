import { describe, expect, it } from "vitest";
import { ISSUE_TYPE_NAMES, allBootstrapLabels, kindLabel } from "../src/taxonomy.js";

describe("taxonomy", () => {
  it("derives kind labels", () => {
    expect(kindLabel("task")).toBe("kind:task");
  });

  it("bootstrap labels cover every kind plus operational/status/priority, no duplicates", () => {
    const labels = allBootstrapLabels();
    for (const kind of Object.keys(ISSUE_TYPE_NAMES)) {
      expect(labels).toContain(`kind:${kind}`);
    }
    expect(labels).toContain("boule:managed");
    expect(labels).toContain("status:accepted");
    expect(labels).toContain("priority:must");
    expect(new Set(labels).size).toBe(labels.length);
  });
});
