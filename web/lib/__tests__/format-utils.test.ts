import { describe, it, expect } from 'vitest';
import { formatCount, formatBytes } from '../format-utils';

// ---------------------------------------------------------------------------
// formatCount
// ---------------------------------------------------------------------------

describe('formatCount', () => {
  it('returns the literal string for values below 1000', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(1)).toBe('1');
    expect(formatCount(999)).toBe('999');
  });

  it('switches to the "k" suffix at exactly 1000', () => {
    expect(formatCount(1000)).toBe('1.0k');
  });

  it('formats thousands with one decimal place', () => {
    expect(formatCount(1500)).toBe('1.5k');
    expect(formatCount(12_345)).toBe('12.3k');
    expect(formatCount(999_999)).toBe('1000.0k');
  });

  it('switches to the "M" suffix at exactly 1,000,000', () => {
    expect(formatCount(1_000_000)).toBe('1.0M');
  });

  it('formats millions with one decimal place', () => {
    expect(formatCount(2_400_000)).toBe('2.4M');
    expect(formatCount(12_345_678)).toBe('12.3M');
  });

  it('formats very large numbers by truncating to one decimal', () => {
    expect(formatCount(1_234_567_890)).toBe('1234.6M');
  });
});

// ---------------------------------------------------------------------------
// formatBytes
// ---------------------------------------------------------------------------

describe('formatBytes', () => {
  it('returns "0 B" for zero bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('uses B/KB/MB/GB suffixes at the appropriate thresholds', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
  });
});
