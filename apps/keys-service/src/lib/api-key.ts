import crypto from "crypto";

/**
 * Generate a new API key in format: mcpf_xxxxxxxxxxxxxxxxxxxx
 */
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(20);
  const hex = randomBytes.toString("hex");
  return `mcpf_${hex}`;
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  return /^mcpf_[a-f0-9]{40}$/.test(key);
}

/**
 * Hash API key for storage (we never store raw keys)
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Get the prefix of an API key for display
 */
export function getKeyPrefix(key: string): string {
  return key.slice(0, 12); // "mcpf_xxxx" first 12 chars
}
