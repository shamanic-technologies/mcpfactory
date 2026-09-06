/**
 * The password in front of every clone host.
 *
 * A clone carries a competitor's copy and their logo, so it must not be readable by
 * anyone who happens to guess the hostname, and it must never be indexed. The gate is
 * Basic auth because it costs one header and works in a browser, an incognito window
 * and a screenshot tool alike — the audience is a handful of people looking at pages.
 *
 * Lives apart from the rest of the clone code because it runs in `src/proxy.ts`, which
 * Next executes on the edge runtime: nothing here may reach for `node:` anything.
 */

/** Constant-time string compare. Rejecting on the first differing byte leaks length and position. */
function equals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Whether an `Authorization` header satisfies `expected`, which is `user:password`.
 *
 * An ABSENT or EMPTY `expected` returns false, deliberately: an unset environment
 * variable must lock the clones rather than open them, so a missing secret is a visible
 * 401 rather than a silent publication.
 */
export function basicAuthOk(header: string | null | undefined, expected: string | undefined): boolean {
  if (!expected || !expected.includes(":")) return false;
  if (!header) return false;

  const [scheme, encoded] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "basic" || !encoded) return false;

  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    return false;
  }
  return equals(decoded, expected);
}
