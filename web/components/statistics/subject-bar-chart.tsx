'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SubjectBreakdownRow } from '@/lib/types';
import { useTranslations } from 'next-intl';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface SubjectBarChartProps {
  data: SubjectBreakdownRow[];
}

export function SubjectBarChart({ data }: SubjectBarChartProps) {
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

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('noSubjectsYet')}
        </p>
        <Link
          href="/subjects"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t('createSubjectLink')}
        </Link>
      </div>
    );
  }

  const labels = data.map(d => d.subject_name);

  const chartData = {
    labels,
    datasets: [
      {
        label: t('chartWrong'),
        data: data.map(d => d.wrong),
        backgroundColor: isDark ? '#fb923c' : '#f97316',
        borderRadius: 4,
      },
      {
        label: t('chartNeedsReview'),
        data: data.map(d => d.needs_review),
        backgroundColor: isDark ? '#fbbf24' : '#f59e0b',
        borderRadius: 4,
      },
      {
        label: t('chartMastered'),
        data: data.map(d => d.mastered),
        backgroundColor: isDark ? '#34d399' : '#10b981',
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: isDark ? '#9ca3af' : '#6b7280',
          usePointStyle: true,
          pointStyle: 'circle' as const,
          padding: 16,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        titleColor: isDark ? '#f9fafb' : '#111827',
        bodyColor: isDark ? '#e5e7eb' : '#374151',
        borderColor: isDark ? '#4b5563' : '#d1d5db',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          color: isDark ? '#374151' : '#f3f4f6',
        },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
          font: { size: 11 },
        },
      },
      y: {
        stacked: true,
        grid: { display: false },
        ticks: {
          color: isDark ? '#d1d5db' : '#374151',
          font: { size: 12 },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
