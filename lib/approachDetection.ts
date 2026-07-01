import type { ApproachVariant } from "./types";

const MIN_NON_STARTER_CHARS = 40;

/**
 * Heuristically guess which approach a user's in-progress code matches.
 * Returns the matching approach id, or null if no signal is strong enough.
 *
 * Each approach can declare `signatureTokens` (regex source strings). We
 * strip the starter prefix and comment/docstring noise, then score each
 * approach by the number of token regexes that fire against the user's
 * code. The highest-scoring approach wins; ties are broken by order.
 */
export function detectApproach(
  userCode: string,
  approaches: ApproachVariant[],
  starterCode: string
): string | null {
  if (!userCode) return null;

  const delta = userCode.startsWith(starterCode)
    ? userCode.slice(starterCode.length)
    : userCode;

  const meaningful = delta
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return false;
      if (t.startsWith("#")) return false;
      if (t.startsWith('"""') || t.startsWith("'''")) return false;
      return true;
    })
    .join("\n");

  if (meaningful.length < MIN_NON_STARTER_CHARS) return null;

  let best: { id: string; score: number } | null = null;
  for (const approach of approaches) {
    const tokens = approach.signatureTokens;
    if (!tokens || tokens.length === 0) continue;

    let score = 0;
    for (const token of tokens) {
      try {
        const re = new RegExp(token, "i");
        if (re.test(userCode)) score++;
      } catch {
        // Malformed regex — skip
      }
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { id: approach.id, score };
    }
  }

  return best?.id ?? null;
}
