import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Regression test: Sentry must be initialized via --import flag BEFORE the
 * main entry point's module graph is resolved, otherwise Express won't be
 * instrumented in ESM mode.
 *
 * Bug: In ESM, static imports are resolved before any code executes. Using
 * `import "./instrument.js"` in index.ts is insufficient because the module
 * linker loads Express before instrument.js runs Sentry.init().
 * Fix: Use `node --import ./dist/instrument.js dist/index.js` so Sentry
 * initializes during Node's startup phase, before any imports are resolved.
 */
describe("Sentry ESM instrumentation", () => {
  const pkgPath = resolve(__dirname, "../../package.json");
  const dockerfilePath = resolve(__dirname, "../../Dockerfile");
  const instrumentPath = resolve(__dirname, "../../src/instrument.ts");
  const indexPath = resolve(__dirname, "../../src/index.ts");

  it("package.json start script uses --import for instrument", () => {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    expect(pkg.scripts.start).toContain("--import");
    expect(pkg.scripts.start).toContain("instrument.js");
  });

  it("Dockerfile CMD uses --import for instrument", () => {
    const dockerfile = readFileSync(dockerfilePath, "utf-8");
    expect(dockerfile).toContain("--import");
    expect(dockerfile).toContain("instrument.js");
  });

  it("instrument.ts initializes Sentry", () => {
    const source = readFileSync(instrumentPath, "utf-8");
    expect(source).toContain("Sentry.init(");
  });

  it("index.ts does not have inline Sentry.init()", () => {
    const source = readFileSync(indexPath, "utf-8");
    expect(source).not.toContain("Sentry.init(");
  });
});
