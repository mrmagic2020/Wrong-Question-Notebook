import { ActivityDay } from './types';

export interface HeatmapCell {
  date: string;
  count: number;
  intensity: number; // 0-4
}

export interface HeatmapWeek {
  cells: HeatmapCell[];
}

/**
 * Build a 26-week heatmap grid from activity data.
 * Returns an array of weeks, each containing 7 day cells (Sun-Sat).
 */
export function buildHeatmapGrid(
  activityData: ActivityDay[],
  weeks: number = 26
): HeatmapWeek[] {
  const countMap = new Map<string, number>();
  for (const day of activityData) {
    countMap.set(day.activity_date, day.activity_count);
  }

  // Find the max count for intensity scaling
  const maxCount = Math.max(1, ...activityData.map(d => d.activity_count));

  const today = new Date();
  const todayDay = today.getDay(); // 0=Sun
  // End of the grid is end of this week (Saturday)
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (6 - todayDay));

  // Start is `weeks` weeks before the end
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - weeks * 7 + 1);

  const grid: HeatmapWeek[] = [];
  const current = new Date(startDate);

  for (let w = 0; w < weeks; w++) {
    const week: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().slice(0, 10);
      const count = countMap.get(dateStr) || 0;
      const isFuture = current > today;
      week.push({
        date: dateStr,
        count: isFuture ? -1 : count,
        intensity: isFuture ? -1 : getHeatmapIntensity(count, maxCount),
      });
      current.setDate(current.getDate() + 1);
    }
    grid.push({ cells: week });
  }

  return grid;
}

/**
 * Map an activity count to a 0-4 intensity level.
 */
export function getHeatmapIntensity(count: number, maxCount: number): number {
  if (count === 0) return 0;
  if (maxCount <= 1) return count > 0 ? 2 : 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

/**
 * Get month labels for the heatmap grid header.
 */
export function getHeatmapMonthLabels(
  grid: HeatmapWeek[]
): { label: string; colStart: number }[] {
  const months: { label: string; colStart: number }[] = [];
  let lastMonth = '';
  let lastColStart = -4; // ensure first label always shows

  for (let w = 0; w < grid.length; w++) {
    const firstDay = grid[w].cells[0];
    if (!firstDay) continue;
    const date = new Date(firstDay.date + 'T00:00:00');
    const monthLabel = date.toLocaleString('en-US', { month: 'short' });
    if (monthLabel !== lastMonth) {
      // Skip if too close to previous label (avoid overlap)
      if (w - lastColStart >= 3) {
        months.push({ label: monthLabel, colStart: w });
        lastColStart = w;
      }
      lastMonth = monthLabel;
    }
  }

  return months;
}
