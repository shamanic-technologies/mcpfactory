import { constants } from "node:fs";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { CLONE_ROUTE_PREFIX, cloneFor } from "@/lib/clone-catalogue";
import {
  clonePathFor,
  contentTypeFor,
  originPathFor,
  pickStoredVariant,
  withinRoot,
} from "@/lib/clone-files";

/**
 * Serves one file of a mirrored competitor landing, verbatim.
 *
 * Reached only through the host rewrite in `src/proxy.ts`, which has already resolved the
 * slug against the catalogue and checked the password. The segment is `internal-clone`
 * rather than `_clone` because a leading underscore is a PRIVATE folder in the app router
 * — it is excluded from routing entirely, so the rewrite fell through to the 404 page —
 * and the proxy 404s this prefix on every host that is not a clone, which is what keeps
 * an addressable path from being a second, password-free door.
 *
 * The response body is the origin's bytes and nothing else. No token substitution, no
 * analytics injection, no JSON-LD rewrite: every rewrite the negotiated-page helper does
 * for OUR pages is exactly what must NOT happen here while a clone is still a copy.
 */

export const dynamic = "force-dynamic";

/**
 * Where the clones live at runtime. The standalone server runs from the repo root inside
 * the image (`node apps/landing/server.js`), while `next dev` runs from this package —
 * so the directory is one path in production and another in development. Resolved once,
 * and it THROWS when neither exists: a clone host that silently 404s everything reads as
 * a broken capture rather than as a missing COPY line in the Dockerfile.
 */
let clonesRootPromise: Promise<string> | null = null;

async function clonesRoot(): Promise<string> {
  clonesRootPromise ??= (async () => {
    const candidates = [
      path.join(process.cwd(), "clones"),
      path.join(process.cwd(), "apps", "landing", "clones"),
    ];
    for (const candidate of candidates) {
      try {
        await access(candidate, constants.R_OK);
        return candidate;
      } catch {
        // try the next one
      }
    }
    throw new Error(
      `[landing] clones directory not found. Looked in: ${candidates.join(", ")}. ` +
        "In the container it is copied by apps/landing/Dockerfile.",
    );
  })();
  return clonesRootPromise;
}

const NOT_FOUND_HEADERS = {
  "content-type": "text/plain; charset=utf-8",
  "x-robots-tag": "noindex, nofollow",
  "cache-control": "no-store",
} as const;

async function readClone(
  slug: string,
  pathname: string,
  search: string,
  accept: string | null,
): Promise<{ body: Buffer; file: string } | null> {
  if (cloneFor(slug) === null) return null;

  const root = path.join(await clonesRoot(), slug);

  // A query-bearing URL is stored beside its plain form, because the origin generates a
  // different response per query (`/_next/image?w=96` and `?w=48` are two pictures). The
  // plain form is tried second so a query the origin ignored — a utm tail on a shared
  // link — still serves the page rather than 404ing.
  const candidates = [clonePathFor(pathname, search), search ? clonePathFor(pathname) : null];

  for (const relative of candidates) {
    if (relative === null) continue;
    const file = path.join(root, relative);
    if (!withinRoot(root, file)) continue;
    try {
      return { body: await readFile(file), file };
    } catch {
      // try the next candidate
    }
  }

  // A query-bearing url whose path carries no extension — `/_next/image?w=256` is the
  // one that matters — is stored with an extension taken from what the origin ANSWERED,
  // which the request cannot name. So the last resort lists the directory and picks the
  // variant this caller's `Accept` asks for, exactly as the origin negotiated it.
  const stemRelative = candidates[0];
  if (search && stemRelative !== null) {
    const directory = path.join(root, path.dirname(stemRelative));
    if (withinRoot(root, directory)) {
      try {
        const names = await readdir(directory);
        const picked = pickStoredVariant(names, path.basename(stemRelative), accept);
        if (picked !== null) {
          const file = path.join(directory, picked);
          if (withinRoot(root, file)) return { body: await readFile(file), file };
        }
      } catch {
        // the directory does not exist — an ordinary miss
      }
    }
  }

  return null;
}

export async function GET(request: Request, context: { params: Promise<{ slug: string; path?: string[] }> }) {
  const { slug } = await context.params;
  const url = new URL(request.url);

  const pathname = originPathFor(url.pathname, CLONE_ROUTE_PREFIX, slug);

  const found = await readClone(slug, pathname, url.search, request.headers.get("accept"));
  if (found === null) {
    return new Response("Not found in this clone.", { status: 404, headers: NOT_FOUND_HEADERS });
  }

  return new Response(new Uint8Array(found.body), {
    headers: {
      "content-type": contentTypeFor(found.file),
      // A clone carries a competitor's copy and their logo under our domain. It is never
      // indexable, and it is never shared-cacheable: the password is per request.
      "x-robots-tag": "noindex, nofollow",
      "cache-control": "no-store",
    },
  });
}

export async function HEAD(request: Request, context: { params: Promise<{ slug: string; path?: string[] }> }) {
  const response = await GET(request, context);
  return new Response(null, { status: response.status, headers: response.headers });
}
