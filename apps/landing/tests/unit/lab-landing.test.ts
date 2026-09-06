import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The next distribute.you landing, built in the lab at apps/landing/clones/distribute/.
 *
 * It is hand-written HTML, so nothing else in the repo pins its copy: these guards hold
 * the decisions that were made out loud while it was designed, so a later edit cannot
 * quietly undo one.
 */
const LAB = path.resolve(__dirname, "../../clones/distribute");
const html = readFileSync(path.join(LAB, "index.html"), "utf8");
const css = readFileSync(path.join(LAB, "styles.css"), "utf8");
const js = readFileSync(path.join(LAB, "main.js"), "utf8");

describe("the lab landing is self-contained", () => {
  it("ships its three files and its assets", () => {
    for (const file of ["index.html", "styles.css", "main.js", "assets/logo-mark.svg"]) {
      expect(existsSync(path.join(LAB, file)), `${file} is missing`).toBe(true);
    }
  });

  it("links only its own stylesheet and script, not the apex landing's", () => {
    expect(html).toContain('href="/styles.css"');
    expect(html).toContain('src="/main.js"');
    expect(html).not.toContain("/landing/css/");
    expect(html).not.toContain("/landing/js/");
    // No live-injection token: the clone route serves raw bytes, so a token here would
    // render as itself. Numbers are hardcoded until the design is frozen.
    expect(html).not.toMatch(/__[A-Z_]+__/);
  });

  it("is never indexed", () => {
    expect(html).toContain('<meta name="robots" content="noindex, nofollow">');
  });
});

describe("the offer the page states", () => {
  it("leads with revenue, from one dollar a day, and thirty free dollars", () => {
    expect(html).toContain("Get revenue in 24h");
    expect(html).toContain("From $1/day");
    expect(html).toMatch(/First \$30 free/);
    expect(html).toContain("Start free");
  });

  it("says nothing about the $400 credit match", () => {
    // Owner-decided: the match is a gamification lever for the dashboard, not a landing
    // promise. "Start free" and "$30 free" are what converts.
    expect(html).not.toContain("$400");
  });

  it("marks every not-yet-live pricing item as coming soon, and only there", () => {
    const pricing = html.slice(html.indexOf('id="pricing"'), html.indexOf('id="faq"'));
    const flagged = (pricing.match(/data-coming-soon/g) ?? []).length;
    expect(flagged).toBeGreaterThanOrEqual(8);
    const outsidePricing = html.replace(pricing, "");
    expect(outsidePricing).not.toContain("data-coming-soon");
    expect(outsidePricing.toLowerCase()).not.toContain("coming soon");
  });

  it("names the three customers from the notes with their real figures", () => {
    for (const line of ["Doc Dinners", "Opsfolio", "Shockwave", "2.2", "4.2", "7.8"]) {
      expect(html).toContain(line);
    }
  });
});

describe("copy discipline", () => {
  it("carries no em-dash anywhere a reader sees", () => {
    expect(html).not.toContain("—");
    expect(js).not.toContain("—");
  });

  it("attributes the sending infrastructure to us, never to the visitor", () => {
    expect(html.toLowerCase()).not.toContain("your sending domain");
    expect(html.toLowerCase()).not.toContain("your domain");
  });

  it("keeps the side-accent ban", () => {
    expect(css).not.toMatch(/border-(left|right|top):\s*[2-9]px/);
  });
});
