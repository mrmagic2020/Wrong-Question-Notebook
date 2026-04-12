import { describe, it, expect } from 'vitest';
import { encodeCursor, decodeCursor, validateCursor } from '../discover-cursor';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const ANOTHER_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

// ---------------------------------------------------------------------------
// encodeCursor / decodeCursor
// ---------------------------------------------------------------------------

describe('encodeCursor + decodeCursor', () => {
  it('round-trips a numeric value and UUID', () => {
    const encoded = encodeCursor(42.5, VALID_UUID);
    expect(decodeCursor(encoded)).toEqual({
      value: '42.5',
      id: VALID_UUID,
    });
  });

  it('round-trips an ISO timestamp value (which itself contains colons)', () => {
    const ts = '2026-04-05T12:08:41.000Z';
    const encoded = encodeCursor(ts, VALID_UUID);
    // Colons in the timestamp must not confuse the splitter — the id side
    // always comes from the last colon.
    expect(decodeCursor(encoded)).toEqual({ value: ts, id: VALID_UUID });
  });

  it('returns null when the cursor contains no colon separator', () => {
    expect(decodeCursor('not-a-cursor')).toBeNull();
  });

  it('returns an empty string value and empty id for a cursor that is just a colon', () => {
    expect(decodeCursor(':')).toEqual({ value: '', id: '' });
  });
});

// ---------------------------------------------------------------------------
// validateCursor — rejection paths (injection surface)
// ---------------------------------------------------------------------------

describe('validateCursor — rejection paths', () => {
  it('rejects a cursor with no separator', () => {
    expect(validateCursor('garbage', 'ranking')).toBeNull();
  });

  it('rejects a cursor whose id side is not a valid UUID', () => {
    expect(validateCursor('100:not-a-uuid', 'ranking')).toBeNull();
    expect(validateCursor('100:123', 'ranking')).toBeNull();
  });

  it('rejects SQL-injection-style payloads in the id field', () => {
    const payload = `100:${VALID_UUID}' OR 1=1--`;
    expect(validateCursor(payload, 'ranking')).toBeNull();
  });

  it('rejects a ranking cursor whose value is not numeric', () => {
    expect(validateCursor(`abc:${VALID_UUID}`, 'ranking')).toBeNull();
  });

  it('rejects a ranking cursor whose value is Infinity', () => {
    expect(validateCursor(`Infinity:${VALID_UUID}`, 'ranking')).toBeNull();
    expect(validateCursor(`-Infinity:${VALID_UUID}`, 'ranking')).toBeNull();
  });

  it('rejects a newest cursor whose value is not a parseable date', () => {
    expect(validateCursor(`not-a-date:${VALID_UUID}`, 'newest')).toBeNull();
  });

  it('rejects when the value contains a PostgREST filter payload', () => {
    // even if the id passes UUID validation, a non-numeric value should fail
    const payload = `,like_count.gt.0:${VALID_UUID}`;
    expect(validateCursor(payload, 'most_liked')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// validateCursor — accept paths
// ---------------------------------------------------------------------------

describe('validateCursor — accept paths', () => {
  it('accepts a valid ranking cursor with numeric score', () => {
    const parsed = validateCursor(`42.5:${VALID_UUID}`, 'ranking');
    expect(parsed).toEqual({ value: '42.5', id: VALID_UUID });
  });

  it('accepts a valid most_liked cursor with integer count', () => {
    const parsed = validateCursor(`100:${ANOTHER_UUID}`, 'most_liked');
    expect(parsed).toEqual({ value: '100', id: ANOTHER_UUID });
  });

  it('accepts a valid most_copied cursor with zero count', () => {
    const parsed = validateCursor(`0:${VALID_UUID}`, 'most_copied');
    expect(parsed).toEqual({ value: '0', id: VALID_UUID });
  });

  it('accepts a valid newest cursor and normalises to ISO-8601', () => {
    const parsed = validateCursor(
      `2026-04-05T12:08:41.000Z:${VALID_UUID}`,
      'newest'
    );
    expect(parsed?.id).toBe(VALID_UUID);
    // Value should be re-emitted as an ISO string
    expect(parsed?.value).toBe(new Date('2026-04-05T12:08:41Z').toISOString());
  });

  it('accepts a newest cursor with a non-standard but parseable date string', () => {
    const parsed = validateCursor(
      `2026-04-05T12:08:41+00:00:${VALID_UUID}`,
      'newest'
    );
    expect(parsed).not.toBeNull();
    // Non-ISO input is normalised to the canonical ISO form
    expect(parsed?.value).toBe(new Date('2026-04-05T12:08:41Z').toISOString());
  });
});
