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
import { useEffect, useState } from 'react';
import { SubjectBreakdownRow } from '@/lib/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface SubjectBarChartProps {
  data: SubjectBreakdownRow[];
}

export function SubjectBarChart({ data }: SubjectBarChartProps) {
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
          No subjects yet
        </p>
      </div>
    );
  }

  const labels = data.map(d => d.subject_name);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Wrong',
        data: data.map(d => d.wrong),
        backgroundColor: isDark ? '#fb923c' : '#f97316',
        borderRadius: 4,
      },
      {
        label: 'Needs Review',
        data: data.map(d => d.needs_review),
        backgroundColor: isDark ? '#fbbf24' : '#f59e0b',
        borderRadius: 4,
      },
      {
        label: 'Mastered',
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
