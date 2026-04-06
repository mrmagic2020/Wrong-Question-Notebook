'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import { WeeklyProgressPoint } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
);

interface ProgressLineChartProps {
  data: WeeklyProgressPoint[];
}

export function ProgressLineChart({ data }: ProgressLineChartProps) {
  const t = useTranslations('Statistics');
  const locale = useLocale();
  const dateLocale = locale === 'zh-CN' ? zhCN : enUS;
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

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('noProgressData')}
        </p>
      </div>
    );
  }

  const labels = data.map(d => format(parseISO(d.week_start), 'MMM d', { locale: dateLocale }));

  const chartData = {
    labels,
    datasets: [
      {
        label: t('masteredProblemsChart'),
        data: data.map(d => d.cumulative_mastered),
        borderColor: isDark ? '#34d399' : '#10b981',
        backgroundColor: isDark
          ? 'rgba(52, 211, 153, 0.1)'
          : 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: isDark ? '#34d399' : '#10b981',
        pointBorderColor: isDark ? '#1f2937' : '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
          label: (ctx: any) =>
            t('masteredTooltip', { count: ctx.parsed.y }),
        },
      },
    },
    scales: {
      x: {
        grid: { color: isDark ? '#374151' : '#f3f4f6' },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
          font: { size: 11 },
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: isDark ? '#374151' : '#f3f4f6' },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
          font: { size: 11 },
          precision: 0,
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}
