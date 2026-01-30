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
