import { isValidUuid } from './common-utils';

export type SortOption = 'ranking' | 'newest' | 'most_liked' | 'most_copied';

/** Encode a (value, id) pair as a keyset-pagination cursor. */
export function encodeCursor(value: string | number, id: string): string {
  return `${value}:${id}`;
}

/**
 * Split a cursor into its (value, id) components using lastIndexOf so values
 * that themselves contain `:` (e.g. ISO timestamps) are parsed correctly.
 */
export function decodeCursor(
  cursor: string
): { value: string; id: string } | null {
  const idx = cursor.lastIndexOf(':');
  if (idx === -1) return null;
  return { value: cursor.slice(0, idx), id: cursor.slice(idx + 1) };
}

/**
 * Validate and decode a pagination cursor, ensuring the id is a valid UUID
 * and the value matches the expected type for the sort mode. Returning null
 * prevents PostgREST filter injection via crafted cursor strings.
 */
export function validateCursor(
  cursor: string,
  sort: SortOption
): { value: string; id: string } | null {
  const parsed = decodeCursor(cursor);
  if (!parsed) return null;

  if (!isValidUuid(parsed.id)) return null;

  switch (sort) {
    case 'newest':
      if (isNaN(Date.parse(parsed.value))) return null;
      parsed.value = new Date(parsed.value).toISOString();
      break;
    case 'most_liked':
    case 'most_copied':
    case 'ranking':
    default:
      if (isNaN(Number(parsed.value)) || !isFinite(Number(parsed.value)))
        return null;
      break;
  }

  return parsed;
}
