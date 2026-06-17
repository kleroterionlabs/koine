// src/security/mentions.ts — neutralize @-mentions so autonomous artifacts never ping people.
// Wrapping a handle in a backtick code span stops GitHub from sending a notification.

// @handle not preceded by a word char/backtick and not part of an email; 1-39 chars, GitHub rules.
const MENTION_RE = /(^|[^A-Za-z0-9_`@/])@([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)\b/g;

export interface MentionResult {
  clean: string;
  stripped: string[]; // handles neutralized
}

export function sanitizeMentions(text: string): MentionResult {
  const stripped: string[] = [];
  const clean = text.replace(MENTION_RE, (_m, pre: string, handle: string) => {
    stripped.push(handle);
    return `${pre}\`@${handle}\``;
  });
  return { clean, stripped };
}
