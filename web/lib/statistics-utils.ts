import { ActivityDay } from './types';
import { toDateInTimezone, DEFAULT_TIMEZONE } from './timezone-utils';

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
  weeks: number = 26,
  timezone: string = DEFAULT_TIMEZONE
): HeatmapWeek[] {
  const countMap = new Map<string, number>();
  for (const day of activityData) {
    countMap.set(day.activity_date, day.activity_count);
  }

  // Find the max count for intensity scaling
  const maxCount = Math.max(1, ...activityData.map(d => d.activity_count));

  const now = new Date();
  const todayStr = toDateInTimezone(now, timezone);

  // Parse as UTC noon to avoid local-timezone day shifts
  const todayDate = new Date(todayStr + 'T12:00:00Z');
  const todayDay = todayDate.getUTCDay(); // 0=Sun

  // End of the grid is end of this week (Saturday)
  const endDate = new Date(todayDate);
  endDate.setUTCDate(todayDate.getUTCDate() + (6 - todayDay));

  // Start is `weeks` weeks before the end
  const startDate = new Date(endDate);
  startDate.setUTCDate(endDate.getUTCDate() - weeks * 7 + 1);

  const grid: HeatmapWeek[] = [];
  const current = new Date(startDate);

  for (let w = 0; w < weeks; w++) {
    const week: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().slice(0, 10);
      const count = countMap.get(dateStr) || 0;
      const isFuture = dateStr > todayStr;
      week.push({
        date: dateStr,
        count: isFuture ? -1 : count,
        intensity: isFuture ? -1 : getHeatmapIntensity(count, maxCount),
      });
      current.setUTCDate(current.getUTCDate() + 1);
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
): { monthIndex: number; colStart: number }[] {
  const months: { monthIndex: number; colStart: number }[] = [];
  let lastMonth: number = -1;
  let lastColStart = -4; // ensure first label always shows

  for (let w = 0; w < grid.length; w++) {
    const firstDay = grid[w].cells[0];
    if (!firstDay) continue;
    const date = new Date(firstDay.date + 'T00:00:00');
    const monthIndex = date.getMonth();
    if (monthIndex !== lastMonth) {
      // Skip if too close to previous label (avoid overlap)
      if (w - lastColStart >= 3) {
        months.push({ monthIndex, colStart: w });
        lastColStart = w;
      }
      lastMonth = monthIndex;
    }
  }

  return months;
}
