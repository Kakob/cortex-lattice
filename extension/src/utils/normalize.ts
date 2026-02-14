// Title normalization utilities

// Normalize a problem title for consistent matching
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    // Remove common prefixes
    .replace(/^\d+\.\s*/, '') // Remove "123. " prefix (LeetCode style)
    .replace(/^problem\s*[:.\-]?\s*/i, '')
    // Remove special characters except spaces
    .replace(/[^a-z0-9\s]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, '-')
    .trim();
}

// Extract problem number from LeetCode title
export function extractProblemNumber(title: string): number | undefined {
  const match = title.match(/^(\d+)\./);
  return match ? parseInt(match[1], 10) : undefined;
}

// Clean title for display
export function cleanTitle(title: string): string {
  return title
    .replace(/^\d+\.\s*/, '') // Remove number prefix
    .trim();
}

// Generate a URL-safe slug
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
