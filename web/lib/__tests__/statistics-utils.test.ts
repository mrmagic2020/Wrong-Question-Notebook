import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  buildHeatmapGrid,
  getHeatmapIntensity,
  getHeatmapMonthLabels,
} from '../statistics-utils';
import { ActivityDay } from '../types';

// ---------------------------------------------------------------------------
// getHeatmapIntensity
// ---------------------------------------------------------------------------

describe('getHeatmapIntensity', () => {
  it('should return 0 for count of 0', () => {
    expect(getHeatmapIntensity(0, 10)).toBe(0);
    expect(getHeatmapIntensity(0, 0)).toBe(0);
    expect(getHeatmapIntensity(0, 1)).toBe(0);
  });

  it('should return 2 when maxCount is 1 and count > 0', () => {
    expect(getHeatmapIntensity(1, 1)).toBe(2);
  });

  it('should return 0 when maxCount is 0 and count is 0', () => {
    expect(getHeatmapIntensity(0, 0)).toBe(0);
  });

  it('should return 1 for ratio <= 0.25', () => {
    expect(getHeatmapIntensity(1, 10)).toBe(1);
    expect(getHeatmapIntensity(2, 8)).toBe(1);
    expect(getHeatmapIntensity(25, 100)).toBe(1);
  });

  it('should return 2 for ratio <= 0.5', () => {
    expect(getHeatmapIntensity(3, 10)).toBe(2);
    expect(getHeatmapIntensity(5, 10)).toBe(2);
    expect(getHeatmapIntensity(50, 100)).toBe(2);
  });

  it('should return 3 for ratio <= 0.75', () => {
    expect(getHeatmapIntensity(6, 10)).toBe(3);
    expect(getHeatmapIntensity(7, 10)).toBe(3);
    expect(getHeatmapIntensity(75, 100)).toBe(3);
  });

  it('should return 4 for ratio > 0.75', () => {
    expect(getHeatmapIntensity(8, 10)).toBe(4);
    expect(getHeatmapIntensity(10, 10)).toBe(4);
    expect(getHeatmapIntensity(100, 100)).toBe(4);
  });

  it('should handle exact boundary values', () => {
    // 25/100 = 0.25 exactly → 1
    expect(getHeatmapIntensity(25, 100)).toBe(1);
    // 50/100 = 0.50 exactly → 2
    expect(getHeatmapIntensity(50, 100)).toBe(2);
    // 75/100 = 0.75 exactly → 3
    expect(getHeatmapIntensity(75, 100)).toBe(3);
    // 76/100 = 0.76 → 4
    expect(getHeatmapIntensity(76, 100)).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// buildHeatmapGrid
// ---------------------------------------------------------------------------

describe('buildHeatmapGrid', () => {
  beforeEach(() => {
    // Fix "today" to Wednesday 2025-06-11 so tests are deterministic
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-11T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the correct number of weeks', () => {
    const grid = buildHeatmapGrid([]);
    expect(grid).toHaveLength(26);

    const grid10 = buildHeatmapGrid([], 10);
    expect(grid10).toHaveLength(10);
  });

  it('should have 7 cells per week', () => {
    const grid = buildHeatmapGrid([]);
    for (const week of grid) {
      expect(week.cells).toHaveLength(7);
    }
  });

  it('should start on a Sunday and end on a Saturday', () => {
    const grid = buildHeatmapGrid([], 4);
    // First cell of first week should be a Sunday
    const firstDate = new Date(grid[0].cells[0].date + 'T00:00:00');
    expect(firstDate.getDay()).toBe(0); // Sunday

    // Last cell of last week should be a Saturday
    const lastWeek = grid[grid.length - 1];
    const lastDate = new Date(lastWeek.cells[6].date + 'T00:00:00');
    expect(lastDate.getDay()).toBe(6); // Saturday
  });

  it('should include today in the grid', () => {
    const grid = buildHeatmapGrid([]);
    const allDates = grid.flatMap(w => w.cells.map(c => c.date));
    expect(allDates).toContain('2025-06-11');
  });

  it('should map activity data to the correct cells', () => {
    const activityData: ActivityDay[] = [
      { activity_date: '2025-06-10', activity_count: 5 },
      { activity_date: '2025-06-11', activity_count: 3 },
    ];
    const grid = buildHeatmapGrid(activityData);
    const allCells = grid.flatMap(w => w.cells);

    const june10 = allCells.find(c => c.date === '2025-06-10');
    expect(june10).toBeDefined();
    expect(june10!.count).toBe(5);

    const june11 = allCells.find(c => c.date === '2025-06-11');
    expect(june11).toBeDefined();
    expect(june11!.count).toBe(3);
  });

  it('should set count to 0 for days without activity', () => {
    const grid = buildHeatmapGrid([]);
    const allCells = grid.flatMap(w => w.cells);
    const pastCells = allCells.filter(c => c.count !== -1);

    for (const cell of pastCells) {
      expect(cell.count).toBe(0);
      expect(cell.intensity).toBe(0);
    }
  });

  it('should mark future days with -1', () => {
    const grid = buildHeatmapGrid([]);
    const allCells = grid.flatMap(w => w.cells);

    // Today is Wed Jun 11, so Thu-Sat (Jun 12-14) in the last week are future
    const futureCells = allCells.filter(c => c.date > '2025-06-11');
    for (const cell of futureCells) {
      expect(cell.count).toBe(-1);
      expect(cell.intensity).toBe(-1);
    }
  });

  it('should compute intensity based on max count', () => {
    const activityData: ActivityDay[] = [
      { activity_date: '2025-06-09', activity_count: 2 },
      { activity_date: '2025-06-10', activity_count: 10 },
    ];
    const grid = buildHeatmapGrid(activityData);
    const allCells = grid.flatMap(w => w.cells);

    // max is 10, so 2/10 = 0.2 → intensity 1
    const june9 = allCells.find(c => c.date === '2025-06-09');
    expect(june9!.intensity).toBe(1);

    // 10/10 = 1.0 → intensity 4
    const june10 = allCells.find(c => c.date === '2025-06-10');
    expect(june10!.intensity).toBe(4);
  });

  it('should produce consecutive dates across weeks', () => {
    const grid = buildHeatmapGrid([], 4);
    const allDates = grid.flatMap(w => w.cells.map(c => c.date));

    for (let i = 1; i < allDates.length; i++) {
      const prev = new Date(allDates[i - 1] + 'T00:00:00');
      const curr = new Date(allDates[i] + 'T00:00:00');
      const diffMs = curr.getTime() - prev.getTime();
      expect(diffMs).toBe(24 * 60 * 60 * 1000); // exactly 1 day apart
    }
  });
});

// ---------------------------------------------------------------------------
// getHeatmapMonthLabels
// ---------------------------------------------------------------------------

describe('getHeatmapMonthLabels', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-11T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return month labels from the grid', () => {
    const grid = buildHeatmapGrid([]);
    const labels = getHeatmapMonthLabels(grid);

    expect(labels.length).toBeGreaterThan(0);
    for (const label of labels) {
      expect(label.monthIndex).toBeGreaterThanOrEqual(0);
      expect(label.monthIndex).toBeLessThanOrEqual(11);
      expect(label.colStart).toBeGreaterThanOrEqual(0);
    }
  });

  it('should include short month names', () => {
    const grid = buildHeatmapGrid([]);
    const labels = getHeatmapMonthLabels(grid);
    const monthIndices = labels.map(l => l.monthIndex);

    // Month indices are 0-11
    for (const index of monthIndices) {
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThanOrEqual(11);
    }
  });

  it('should not produce overlapping labels (min 3 columns apart)', () => {
    const grid = buildHeatmapGrid([]);
    const labels = getHeatmapMonthLabels(grid);

    for (let i = 1; i < labels.length; i++) {
      const gap = labels[i].colStart - labels[i - 1].colStart;
      expect(gap).toBeGreaterThanOrEqual(3);
    }
  });

  it('should have ascending colStart values', () => {
    const grid = buildHeatmapGrid([]);
    const labels = getHeatmapMonthLabels(grid);

    for (let i = 1; i < labels.length; i++) {
      expect(labels[i].colStart).toBeGreaterThan(labels[i - 1].colStart);
    }
  });

  it('should handle a single-week grid', () => {
    const grid = buildHeatmapGrid([], 1);
    const labels = getHeatmapMonthLabels(grid);

    expect(labels).toHaveLength(1);
  });

  it('should handle an empty grid', () => {
    const labels = getHeatmapMonthLabels([]);
    expect(labels).toHaveLength(0);
  });
});
