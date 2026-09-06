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

  it("names the three customers with the figures features-service served on 2026-09-06", () => {
    // Read off /brands/:id/revenue in prod, not off the whiteboard: ROI, cost per outcome and
    // the funnel counts the live cards are seeded from.
    for (const line of ["Doc Dinners", "Opsfolio", "Shockwave", "2.2", "9.3", "3.8", "12,307", "2,157", "2,875"]) {
      expect(html).toContain(line);
    }
    expect((html.match(/data-live/g) ?? []).length).toBe(3);
  });

  it("quotes only people who said the words, and never a fabricated founder", () => {
    for (const who of ["Ryan W.D. Parenti", "Andrew Becker", "Nazim Zidi", "Christian Lemke", "Katherine Fleishman", "Totoche"]) {
      expect(html).toContain(who);
    }
    // The first cut carried an invented Shockwave quote; nobody there said it.
    expect(html).not.toContain("somebody who asked for a call");
    // Katherine is an expert, not an Opsfolio customer: her quote lives in the quotes grid only.
    const proof = html.slice(html.indexOf('id="proof"'), html.indexOf('id="quotes"'));
    expect(proof).not.toContain("Katherine");
  });

  it("prices the managed plan on the calculator the owner picked", () => {
    expect(html).toContain("Monthly paid acquisition budget");
    expect(js).toContain("var COST_PER_MEETING = 600;");
    expect(js).toContain("var FEE_SHARE = 0.3;");
    // The fee is stated, never called "included".
    expect(html).not.toContain("Our fee, included");
    expect(html).toContain("Paid media budget 100% refunded");
    expect(html).toContain("Agency fee excluded");
  });

  it("promises two minutes, never thirty seconds", () => {
    expect(html).toContain("Start in 2 minutes");
    expect(html).not.toMatch(/30 ?s(econds)?\b/);
  });

  it("counts the people on board from the signups in client-service", () => {
    // 71 real users on 2026-09-06 (`system-` principals excluded); refresh when it moves.
    expect(html).toContain("70+ founders and GTM experts");
    const hero = html.slice(html.indexOf('class="hero"'), html.indexOf('id="proof"'));
    expect(hero).not.toContain("faces-row");
    const footer = html.slice(html.indexOf("<footer>"));
    expect(footer).toContain("faces-row");
    expect((footer.match(/<img src="\/assets\/[a-z-]+\.jpe?g"/g) ?? []).length).toBe(6);
  });

  it("states the reply-handling feature, and no channel map", () => {
    expect(html).toContain("Answers interested leads ourselves, until the meeting is booked");
    // The 36-channel hub read as far-fetched and was cut; the #1 channel row carries the best ROI.
    expect(html).not.toContain('id="channels"');
    expect(html).toContain('<span class="win">Sales cold email</span></td><td></td><td class="roi">10.2x</td>');
  });
});
