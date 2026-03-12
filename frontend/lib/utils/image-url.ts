/**
 * Image URL utilities
 * Helpers for validating and handling image URLs in Next.js Image component
 */

/**
 * Check if a URL is a valid direct image URL (not an HTML page)
 */
export function isValidImageUrl(url: string): boolean {
  if (url.includes('unsplash.com/photos/')) return false;
  return true;
}

/**
 * Check if URL is a localhost/private URL that Next.js Image optimization can't handle
 */
export function isLocalUrl(url: string): boolean {
  return url.includes('localhost') || url.includes('127.0.0.1');
}
