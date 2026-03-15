import { describe, it, expect } from 'vitest';
import { hasOnlyOwnedAssetPaths } from '../common-utils';

const USER_A = '550e8400-e29b-41d4-a716-446655440000';
const USER_B = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('hasOnlyOwnedAssetPaths', () => {
  it('returns true when all asset paths belong to the user', () => {
    expect(
      hasOnlyOwnedAssetPaths(
        USER_A,
        [{ path: `user/${USER_A}/problems/abc/problem/img.png` }],
        [{ path: `user/${USER_A}/problems/abc/solution/img.png` }]
      )
    ).toBe(true);
  });

  it('returns true when assets are empty', () => {
    expect(hasOnlyOwnedAssetPaths(USER_A, [], [])).toBe(true);
  });

  it('returns true when assets are undefined', () => {
    expect(hasOnlyOwnedAssetPaths(USER_A, undefined, undefined)).toBe(true);
  });

  it('rejects foreign asset paths in assets', () => {
    expect(
      hasOnlyOwnedAssetPaths(
        USER_A,
        [{ path: `user/${USER_B}/problems/abc/problem/img.png` }],
        []
      )
    ).toBe(false);
  });

  it('rejects foreign asset paths in solution_assets', () => {
    expect(
      hasOnlyOwnedAssetPaths(
        USER_A,
        [],
        [{ path: `user/${USER_B}/problems/abc/solution/img.png` }]
      )
    ).toBe(false);
  });

  it('rejects when mixed own and foreign paths', () => {
    expect(
      hasOnlyOwnedAssetPaths(
        USER_A,
        [
          { path: `user/${USER_A}/problems/abc/problem/own.png` },
          { path: `user/${USER_B}/problems/xyz/problem/foreign.png` },
        ],
        []
      )
    ).toBe(false);
  });

  it('rejects path traversal attempts', () => {
    expect(
      hasOnlyOwnedAssetPaths(
        USER_A,
        [{ path: `user/${USER_A}/../${USER_B}/problems/abc/problem/img.png` }],
        []
      )
    ).toBe(false);
  });

  it('rejects dot-segment traversal in solution assets', () => {
    expect(
      hasOnlyOwnedAssetPaths(
        USER_A,
        [],
        [
          {
            path: `user/${USER_A}/./../../${USER_B}/problems/abc/solution/img.png`,
          },
        ]
      )
    ).toBe(false);
  });

  it('rejects empty-string user ID prefix spoofing', () => {
    expect(
      hasOnlyOwnedAssetPaths(
        USER_A,
        [{ path: `user/${USER_B}/problems/abc/problem/img.png` }],
        []
      )
    ).toBe(false);
  });
});
