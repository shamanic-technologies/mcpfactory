/**
 * The clone host shape, for the capture and verification scripts.
 *
 * A copy of the two constants in `src/lib/clone-catalogue.ts` rather than an import: these
 * scripts run under plain node, which cannot read a `.ts` module. `tests/unit/clone-serving.test.ts`
 * pins the two spellings equal so the copy cannot drift.
 */
export const CLONE_HOST_PREFIX = "lab-";
export const CLONE_HOST_SUFFIX = ".distribute.you";
