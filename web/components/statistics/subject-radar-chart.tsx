'use client';

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import { SubjectBreakdownRow } from '@/lib/types';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

interface SubjectRadarChartProps {
  data: SubjectBreakdownRow[];
}

export function SubjectRadarChart({ data }: SubjectRadarChartProps) {
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

  if (data.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-orange-600 dark:text-orange-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Need at least 3 subjects for radar chart
        </p>
      </div>
    );
  }

  const chartData = {
    labels: data.map(d => d.subject_name),
    datasets: [
      {
        label: 'Mastery %',
        data: data.map(d => d.mastery_pct),
        backgroundColor: isDark
          ? 'rgba(251, 191, 36, 0.2)'
          : 'rgba(245, 158, 11, 0.2)',
        borderColor: isDark ? '#fbbf24' : '#f59e0b',
        borderWidth: 2,
        pointBackgroundColor: isDark ? '#fbbf24' : '#f59e0b',
        pointBorderColor: isDark ? '#1f2937' : '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
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
          label: (ctx: any) => `Mastery: ${ctx.parsed.r}%`,
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 25,
          color: isDark ? '#6b7280' : '#9ca3af',
          backdropColor: 'transparent',
          font: { size: 10 },
        },
        grid: {
          color: isDark ? '#374151' : '#e5e7eb',
        },
        angleLines: {
          color: isDark ? '#374151' : '#e5e7eb',
        },
        pointLabels: {
          color: isDark ? '#d1d5db' : '#374151',
          font: { size: 11 },
        },
      },
    },
  };

  return <Radar data={chartData} options={options} />;
}
