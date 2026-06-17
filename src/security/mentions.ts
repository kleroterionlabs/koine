// src/security/mentions.ts — generated artifacts must never @-mention people. Agents invent role
// handles (@platform-lead, @tech-lead) that ghost-tag non-existent users; this neutralizes any
// GitHub-mention-shaped token by dropping the leading "@" (the word survives as plain text). Real
// human @-mentions belong in human-authored comments, not generated bodies.

// A mention is "@name" or "@org/team": starts with @ at a non-identifier boundary (so emails like
// a@b.com are skipped — note the `.` in the negated class), name is GitHub-shaped (alphanumeric +
// single hyphens, ≤39 chars) with an optional /team suffix.
const MENTION = /(^|[^A-Za-z0-9_/@.])@([A-Za-z0-9](?:[A-Za-z0-9-]{0,38})(?:\/[A-Za-z0-9._-]+)?)/g;

export interface MentionResult {
  clean: string;
  stripped: string[]; // handles neutralized (deduped)
}

export function sanitizeMentions(text: string): MentionResult {
  const stripped = new Set<string>();
  const clean = text.replace(MENTION, (_full, pre: string, handle: string) => {
    stripped.add(handle);
    return `${pre}${handle}`;
  });
  return { clean, stripped: [...stripped] };
}
