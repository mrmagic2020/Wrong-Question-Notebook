'use client';

import { useRef, useEffect, useState } from 'react';
import { ActivityDay } from '@/lib/types';
import {
  buildHeatmapGrid,
  getHeatmapMonthLabels,
} from '@/lib/statistics-utils';

interface ActivityHeatmapProps {
  data: ActivityDay[];
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const CELL_SIZE = 12;
const CELL_GAP = 3;

const INTENSITY_COLORS_LIGHT = [
  'rgba(245, 158, 11, 0.06)', // 0 — empty
  'rgba(245, 158, 11, 0.35)', // 1 — light
  'rgba(245, 158, 11, 0.55)', // 2 — medium
  'rgba(245, 158, 11, 0.75)', // 3 — high
  'rgba(217, 119, 6, 0.9)', // 4 — intense
];

const INTENSITY_COLORS_DARK = [
  'rgba(120, 113, 108, 0.25)', // 0 — empty
  'rgba(180, 83, 9, 0.45)', // 1 — light
  'rgba(217, 119, 6, 0.6)', // 2 — medium
  'rgba(245, 158, 11, 0.75)', // 3 — high
  'rgba(251, 191, 36, 0.9)', // 4 — intense
];

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(false);
  const grid = buildHeatmapGrid(data, 26);
  const monthLabels = getHeatmapMonthLabels(grid);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // Auto-scroll to the right (present) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const totalActivity = data.reduce((sum, d) => sum + d.activity_count, 0);
  const colors = isDark ? INTENSITY_COLORS_DARK : INTENSITY_COLORS_LIGHT;

  return (
    <div className="stats-bento-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Activity
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {totalActivity} action{totalActivity !== 1 ? 's' : ''} in the last 6
          months
        </p>
      </div>

      <div ref={scrollRef} className="overflow-x-auto pb-2">
        <div style={{ display: 'inline-flex' }}>
          {/* Day labels column */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: CELL_GAP,
              marginRight: 8,
              paddingTop: 20,
            }}
          >
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                style={{
                  height: CELL_SIZE,
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 10,
                  lineHeight: 1,
                }}
                className="text-gray-400 dark:text-gray-500"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid area */}
          <div>
            {/* Month labels row */}
            <div
              style={{
                display: 'flex',
                gap: CELL_GAP,
                marginBottom: 4,
                height: 16,
              }}
            >
              {grid.map((_, weekIdx) => {
                const monthLabel = monthLabels.find(
                  m => m.colStart === weekIdx
                );
                return (
                  <div
                    key={weekIdx}
                    style={{
                      width: CELL_SIZE,
                      flexShrink: 0,
                      fontSize: 10,
                      lineHeight: 1,
                      overflow: 'visible',
                      whiteSpace: 'nowrap',
                    }}
                    className="text-gray-400 dark:text-gray-500"
                  >
                    {monthLabel?.label || ''}
                  </div>
                );
              })}
            </div>

            {/* Cell grid: columns = weeks, rows = days */}
            <div style={{ display: 'flex', gap: CELL_GAP }}>
              {grid.map((week, weekIdx) => (
                <div
                  key={weekIdx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: CELL_GAP,
                  }}
                >
                  {week.cells.map((cell, dayIdx) => (
                    <div
                      key={`${weekIdx}-${dayIdx}`}
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        borderRadius: 2,
                        flexShrink: 0,
                        backgroundColor:
                          cell.intensity === -1
                            ? 'transparent'
                            : colors[cell.intensity] || colors[0],
                      }}
                      title={
                        cell.intensity === -1
                          ? ''
                          : `${cell.date}: ${cell.count} action${cell.count !== 1 ? 's' : ''}`
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          Less
        </span>
        {[0, 1, 2, 3, 4].map(level => (
          <div
            key={level}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              borderRadius: 2,
              backgroundColor: colors[level],
            }}
          />
        ))}
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          More
        </span>
      </div>
    </div>
  );
}
