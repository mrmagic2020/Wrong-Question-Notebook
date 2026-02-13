'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useEffect, useState } from 'react';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieSlice {
  label: string;
  value: number;
  colorLight: string;
  colorDark: string;
}

interface StatusPieChartProps {
  data: PieSlice[];
  size?: number;
}

export default function StatusPieChart({
  data,
  size = 180,
}: StatusPieChartProps) {
  const [isDark, setIsDark] = useState(false);

  // Detect dark mode
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

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <div
          className="rounded-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-2 border-amber-200/40 dark:border-amber-800/30"
          style={{ width: size, height: size }}
        />
      </div>
    );
  }

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        data: data.map(d => d.value),
        backgroundColor: data.map(d => (isDark ? d.colorDark : d.colorLight)),
        borderColor: isDark ? '#1f2937' : '#ffffff',
        borderWidth: 3,
        hoverBorderColor: isDark ? '#374151' : '#f9fafb',
        hoverBorderWidth: 4,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        titleColor: isDark ? '#f9fafb' : '#111827',
        bodyColor: isDark ? '#e5e7eb' : '#374151',
        borderColor: isDark ? '#4b5563' : '#d1d5db',
        borderWidth: 1,
        padding: 14,
        displayColors: true,
        boxPadding: 6,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function (context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '0%',
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  };

  return (
    <div className="flex flex-col items-center justify-center gap-5 w-full h-full py-2">
      <div
        style={{ width: size, height: size }}
        className="drop-shadow-lg transition-all duration-300 hover:drop-shadow-xl"
      >
        <Doughnut data={chartData} options={options} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <div
              className="h-3 w-3 rounded-full shadow-sm"
              style={{
                backgroundColor: isDark ? d.colorDark : d.colorLight,
              }}
            />
            <span className="text-muted-foreground font-medium">
              {d.label}{' '}
              <span className="font-semibold text-foreground">{d.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
