'use client';

import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import { StatisticsOverview } from '@/lib/types';

ChartJS.register(ArcElement, Tooltip);

interface StatusDoughnutChartProps {
  overview: StatisticsOverview;
}

export function StatusDoughnutChart({ overview }: StatusDoughnutChartProps) {
  const [isDark, setIsDark] = useState(false);

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

  const total = overview.total_problems;
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No problems yet
        </p>
      </div>
    );
  }

  const slices = [
    {
      label: 'Wrong',
      value: overview.wrong_count,
      colorLight: '#f97316',
      colorDark: '#fb923c',
    },
    {
      label: 'Needs Review',
      value: overview.needs_review_count,
      colorLight: '#f59e0b',
      colorDark: '#fbbf24',
    },
    {
      label: 'Mastered',
      value: overview.mastered_count,
      colorLight: '#10b981',
      colorDark: '#34d399',
    },
  ];

  const chartData = {
    labels: slices.map(s => s.label),
    datasets: [
      {
        data: slices.map(s => s.value),
        backgroundColor: slices.map(s => (isDark ? s.colorDark : s.colorLight)),
        borderColor: isDark ? '#1c1917' : '#ffffff',
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        titleColor: isDark ? '#f9fafb' : '#111827',
        bodyColor: isDark ? '#e5e7eb' : '#374151',
        borderColor: isDark ? '#4b5563' : '#d1d5db',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => {
            const value = ctx.parsed;
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${ctx.label}: ${value} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="flex flex-col items-center gap-4 h-full justify-center">
      <div className="relative w-44 h-44">
        <Doughnut data={chartData} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {overview.mastery_rate}%
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Mastery
          </span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {slices.map(s => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: isDark ? s.colorDark : s.colorLight,
              }}
            />
            <span className="text-gray-500 dark:text-gray-400">{s.label}</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
