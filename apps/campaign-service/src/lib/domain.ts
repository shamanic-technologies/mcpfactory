/**
 * Extract domain from a URL
 * Example: "https://www.mcpfactory.org/about" → "mcpfactory.org"
 */
export function extractDomain(brandUrl: string): string {
  try {
    const parsed = new URL(brandUrl);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    // If URL parsing fails, try to extract domain directly
    const match = brandUrl.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
    return match ? match[1].replace(/^www\./, '') : brandUrl;
  }
}

/**
 * Normalize a URL to ensure it has a protocol
 */
export function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}
