'use client';

import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Link } from '@/i18n/navigation';
import { useEffect, useState } from 'react';
import { StatisticsOverview } from '@/lib/types';
import { useTranslations } from 'next-intl';

ChartJS.register(ArcElement, Tooltip);

interface StatusDoughnutChartProps {
  overview: StatisticsOverview;
}

export function StatusDoughnutChart({ overview }: StatusDoughnutChartProps) {
  const t = useTranslations('Statistics');
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
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-amber-600 dark:text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('noProblemsYet')}
        </p>
        <Link
          href="/subjects"
          className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
        >
          {t('logFirstProblem')}
        </Link>
      </div>
    );
  }

  const slices = [
    {
      label: t('chartWrong'),
      value: overview.wrong_count,
      colorLight: '#f97316',
      colorDark: '#fb923c',
    },
    {
      label: t('chartNeedsReview'),
      value: overview.needs_review_count,
      colorLight: '#f59e0b',
      colorDark: '#fbbf24',
    },
    {
      label: t('chartMastered'),
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
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {overview.mastery_rate}%
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t('masteryLabel')}
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
