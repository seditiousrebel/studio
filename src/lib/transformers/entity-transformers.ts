
// src/lib/transformers/entity-transformers.ts
import type { Tag } from '@/types';

/**
 * Transforms an array of Tag objects or a comma-separated string of tags into a single comma-separated string.
 * @param tags - The tags to transform, can be an array of Tag objects, an array of strings, or a string.
 * @returns A comma-separated string of tag names.
 */
export function transformTagsArrayToString(tags: Tag[] | string | string[] | undefined | null): string {
  if (typeof tags === 'string') return tags;
  if (Array.isArray(tags) && tags.length > 0) {
    return tags
      .map(t => (typeof t === 'object' && t && 'name' in t ? (t as Tag).name : String(t)))
      .filter(Boolean)
      .join(', ');
  }
  return '';
}

/**
 * Transforms a comma-separated string of tags into an array of trimmed strings.
 * @param tagsString - The comma-separated string of tags.
 * @returns An array of tag names.
 */
export function transformTagsStringToArray(tagsString: string | undefined | null): string[] {
  if (!tagsString || typeof tagsString !== 'string') return [];
  return tagsString.split(',').map(t => t.trim()).filter(Boolean);
}
