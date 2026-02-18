/**
 * @ijonis/geo-lint Content Adapter Types
 */

import type { ContentItem } from '../types.js';

/**
 * Adapter interface for custom content sources.
 * Implement this to integrate geo-lint with any CMS or content pipeline.
 */
export interface ContentAdapter {
  /** Load all content items from the source */
  loadItems(projectRoot: string): ContentItem[] | Promise<ContentItem[]>;
}

/**
 * Create an adapter from a simple function
 */
export function createAdapter(
  fn: (projectRoot: string) => ContentItem[] | Promise<ContentItem[]>,
): ContentAdapter {
  return { loadItems: fn };
}
