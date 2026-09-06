/**
 * The competitor landings we mirror, one entry per clone.
 *
 * These exist to be COPIED, not to be published: each one is served byte-for-byte as
 * its origin served it, logo included, so that a design conversation can happen against
 * the real thing rather than a description of it. Nothing about a clone is ours until
 * someone deliberately makes it ours, which is what `brandised` records.
 *
 * Two properties are load-bearing and enforced by `tests/unit/clone-serving.test.ts`:
 * a clone is reachable ONLY through the host named here (so nothing is discoverable by
 * guessing a path on distribute.you), and every entry has files on disk (so a host that
 * resolves cannot 404 its way through the whole site).
 */
export type Clone = {
  /** Directory under `apps/landing/clones/`, and the `lab-<slug>` half of the host. */
  readonly slug: string;
  /** The page this was taken from, verbatim, so a re-capture cannot drift. */
  readonly source: string;
  /** When it was captured. A clone is a photograph; the origin moves on. */
  readonly capturedAt: string;
  /**
   * FALSE means the bytes are still exactly the origin's, which is what every clone
   * starts as. Flip it when a clone stops being a copy and starts being ours — it is
   * what a future change reads before injecting anything of our own (analytics, CTAs,
   * our own marks), so that "identical at t=0" stays true by construction.
   */
  readonly brandised: boolean;
};

export const CLONES: readonly Clone[] = [
  { slug: "explee", source: "https://explee.com/", capturedAt: "2026-09-06", brandised: false },
  { slug: "revid", source: "https://www.revid.ai/", capturedAt: "2026-09-06", brandised: false },
  { slug: "outrank", source: "https://www.outrank.so/", capturedAt: "2026-09-06", brandised: false },
  { slug: "trustmrr", source: "https://trustmrr.com/", capturedAt: "2026-09-06", brandised: false },
];

/**
 * The internal path `src/proxy.ts` rewrites a clone request onto, and the app-router
 * segment that serves it.
 *
 * NOT `_clone`: a leading underscore marks a PRIVATE folder in the app router, so such a
 * segment is excluded from routing and every rewrite onto it falls through to the 404
 * page. Being routable means it is also addressable, which is why the proxy 404s this
 * prefix on any host that is not a clone — otherwise it would be a second door onto the
 * clones with no password on it.
 */
export const CLONE_ROUTE_PREFIX = "/internal-clone";

/** `lab-<slug>.distribute.you` — one level, so Universal SSL already covers it. */
export const CLONE_HOST_PREFIX = "lab-";
export const CLONE_HOST_SUFFIX = ".distribute.you";

/**
 * The clone a request's Host belongs to, or null for every ordinary landing request.
 *
 * Resolved against the CATALOGUE rather than against the filesystem: a host is an
 * allowlist entry, so a made-up `lab-anything` cannot reach a directory read.
 */
export function cloneSlugForHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].trim().toLowerCase();
  if (!hostname.startsWith(CLONE_HOST_PREFIX) || !hostname.endsWith(CLONE_HOST_SUFFIX)) return null;

  const slug = hostname.slice(CLONE_HOST_PREFIX.length, hostname.length - CLONE_HOST_SUFFIX.length);
  return CLONES.some((clone) => clone.slug === slug) ? slug : null;
}

export function cloneFor(slug: string): Clone | null {
  return CLONES.find((clone) => clone.slug === slug) ?? null;
}
