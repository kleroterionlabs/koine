import { describe, expect, it } from "vitest";
import { sanitizeMentions } from "../src/security/mentions.js";
import { cleanOutbound } from "../src/security/outbound.js";
import { scrubSecrets } from "../src/security/secrets.js";

describe("scrubSecrets", () => {
  it("redacts known credential shapes and reports the kinds", () => {
    const r = scrubSecrets(
      "token ghp_0123456789abcdefghij0123456789abcd and key sk-ant-0123456789abcdefghij",
    );
    expect(r.clean).not.toContain("ghp_0123456789");
    expect(r.clean).toContain("[REDACTED:github-token]");
    expect(r.found).toContain("github-token");
    expect(r.found).toContain("anthropic-key");
  });

  it("leaves clean text untouched", () => {
    expect(scrubSecrets("nothing secret here").found).toEqual([]);
  });
});

describe("sanitizeMentions", () => {
  it("backtick-wraps @-handles so they don't notify, and reports them", () => {
    const r = sanitizeMentions("cc @octocat please");
    expect(r.clean).toBe("cc `@octocat` please");
    expect(r.stripped).toEqual(["octocat"]);
  });

  it("leaves emails alone", () => {
    const r = sanitizeMentions("mail me at a@example.com");
    expect(r.stripped).toEqual([]);
    expect(r.clean).toBe("mail me at a@example.com");
  });
});

describe("cleanOutbound", () => {
  it("scrubs secrets AND mentions in one pass", () => {
    const r = cleanOutbound("ping @octocat with ghp_0123456789abcdefghij0123456789abcd");
    expect(r.clean).toContain("`@octocat`");
    expect(r.clean).toContain("[REDACTED:github-token]");
    expect(r.mentions).toEqual(["octocat"]);
    expect(r.secrets).toEqual(["github-token"]);
  });
});
