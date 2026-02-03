import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Regression test: Sentry must be initialized via instrument.ts BEFORE Express
 * is imported, otherwise Express won't be instrumented in ESM mode.
 *
 * Bug: index.ts had inline Sentry.init() after importing Express, causing
 * "[Sentry] express is not instrumented" error at startup.
 */
describe("Sentry ESM instrumentation", () => {
  const indexPath = resolve(__dirname, "../../src/index.ts");
  const source = readFileSync(indexPath, "utf-8");
  const lines = source.split("\n");

  it("imports instrument.js before express", () => {
    const instrumentLine = lines.findIndex((l) =>
      l.includes('import "./instrument.js"')
    );
    const expressLine = lines.findIndex((l) =>
      l.includes('import express from "express"')
    );

    expect(instrumentLine).toBeGreaterThanOrEqual(0);
    expect(expressLine).toBeGreaterThanOrEqual(0);
    expect(instrumentLine).toBeLessThan(expressLine);
  });

  it("does not have inline Sentry.init() in index.ts", () => {
    const hasSentryInit = source.includes("Sentry.init(");
    expect(hasSentryInit).toBe(false);
  });
});
