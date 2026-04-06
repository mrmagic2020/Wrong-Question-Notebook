'use client';

import { useRef, useEffect, useState } from 'react';
import { ActivityDay } from '@/lib/types';
import {
  buildHeatmapGrid,
  getHeatmapMonthLabels,
} from '@/lib/statistics-utils';
import { useTranslations, useFormatter } from 'next-intl';

interface ActivityHeatmapProps {
  data: ActivityDay[];
  timezone?: string;
}

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

export function ActivityHeatmap({ data, timezone }: ActivityHeatmapProps) {
  const t = useTranslations('Statistics');
  const format = useFormatter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(false);
  const grid = buildHeatmapGrid(data, 26, timezone);
  const monthLabelsData = getHeatmapMonthLabels(grid);

  // Reconstruct month labels using locale-aware formatter
  const monthLabels = monthLabelsData.map(m => {
    const d = new Date(2024, m.monthIndex, 1);
    return {
      label: format.dateTime(d, { month: 'short' }),
      colStart: m.colStart
    };
  });
  
  const DAY_LABELS = ['', t('dayMon'), '', t('dayWed'), '', t('dayFri'), ''];

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

  if (totalActivity === 0) {
    return (
      <div className="stats-bento-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {t('activity')}
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-6 gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('noActivityYet')}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t('startTracking')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="stats-bento-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {t('activity')}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('actionsInPeriod', { count: totalActivity })}
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
                          : t('cellTooltip', { date: cell.date, count: cell.count })
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
          {t('lessActivity')}
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
          {t('moreActivity')}
        </span>
      </div>
    </div>
  );
}
