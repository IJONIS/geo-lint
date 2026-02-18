import type { ContentItem } from '../types.js';

/** Get the relative file path for display in lint results */
export function getDisplayPath(item: ContentItem): string {
  return `${item.contentType}/${item.slug}`;
}
