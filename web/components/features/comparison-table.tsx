'use client';

import { Check, X, Minus } from 'lucide-react';

interface ComparisonRow {
  feature: string;
  physical: { icon: 'check' | 'cross' | 'partial'; label: string };
  digital: { icon: 'check' | 'cross' | 'partial'; label: string };
  wqn: { icon: 'check' | 'cross' | 'partial'; label: string };
}

const rows: ComparisonRow[] = [
  {
    feature: 'Record wrong questions',
    physical: { icon: 'check', label: 'Handwrite' },
    digital: { icon: 'check', label: 'Photo/Screenshot' },
    wqn: { icon: 'check', label: 'Structured form' },
  },
  {
    feature: 'Organize by subject',
    physical: { icon: 'partial', label: 'Separate notebooks' },
    digital: { icon: 'partial', label: 'Folders/headings' },
    wqn: { icon: 'check', label: 'Subjects with colors & icons' },
  },
  {
    feature: 'Search & filter',
    physical: { icon: 'cross', label: 'Flip through pages' },
    digital: { icon: 'partial', label: 'Ctrl+F text only' },
    wqn: { icon: 'check', label: 'Tags, status, smart filters' },
  },
  {
    feature: 'Track mastery progress',
    physical: { icon: 'cross', label: 'Tally marks?' },
    digital: { icon: 'cross', label: 'Manual tracking' },
    wqn: { icon: 'check', label: 'Automatic status tracking' },
  },
  {
    feature: 'Review sessions',
    physical: { icon: 'partial', label: 'Self-directed' },
    digital: { icon: 'partial', label: 'Self-directed' },
    wqn: { icon: 'check', label: 'Interactive with auto-marking' },
  },
  {
    feature: 'Analytics & insights',
    physical: { icon: 'cross', label: 'None' },
    digital: { icon: 'cross', label: 'None' },
    wqn: { icon: 'check', label: 'Charts, heatmaps, streaks' },
  },
  {
    feature: 'Share with others',
    physical: { icon: 'cross', label: 'Photocopy' },
    digital: { icon: 'check', label: 'Share doc link' },
    wqn: { icon: 'check', label: 'Share access link' },
  },
  {
    feature: 'Access anywhere',
    physical: { icon: 'cross', label: 'Carry it' },
    digital: { icon: 'check', label: 'Any browser' },
    wqn: { icon: 'check', label: 'Any browser' },
  },
];

function StatusIcon({ type }: { type: 'check' | 'cross' | 'partial' }) {
  if (type === 'check') {
    return (
      <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
      </div>
    );
  }
  if (type === 'partial') {
    return (
      <div className="w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
        <Minus className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
      </div>
    );
  }
  return (
    <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
      <X className="w-3 h-3 text-red-500 dark:text-red-400" />
    </div>
  );
}

export function ComparisonTable() {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400 w-[28%]">
                Feature
              </th>
              <th className="text-center p-4 text-sm font-medium text-gray-500 dark:text-gray-400 w-[24%]">
                Physical Notebook
              </th>
              <th className="text-center p-4 text-sm font-medium text-gray-500 dark:text-gray-400 w-[24%]">
                Digital Document
              </th>
              <th className="text-center p-4 text-sm font-semibold text-amber-700 dark:text-amber-300 w-[24%] bg-amber-200/50 dark:bg-amber-900/20 rounded-t-xl">
                WQN
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.feature}
                className={
                  i % 2 === 0
                    ? 'bg-gray-50/50 dark:bg-gray-800/20'
                    : 'bg-transparent'
                }
              >
                <td className="p-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {row.feature}
                </td>
                <td className="p-4">
                  <div className="flex flex-col items-center gap-1">
                    <StatusIcon type={row.physical.icon} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {row.physical.label}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col items-center gap-1">
                    <StatusIcon type={row.digital.icon} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {row.digital.label}
                    </span>
                  </div>
                </td>
                <td className="p-4 bg-amber-200/30 dark:bg-amber-900/20">
                  <div className="flex flex-col items-center gap-1">
                    <StatusIcon type={row.wqn.icon} />
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      {row.wqn.label}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden space-y-3">
        {rows.map(row => (
          <div
            key={row.feature}
            className="rounded-xl border border-gray-200/60 dark:border-gray-800/60 p-4 space-y-3"
          >
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {row.feature}
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-1 text-center">
                <StatusIcon type={row.physical.icon} />
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  Physical
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  {row.physical.label}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <StatusIcon type={row.digital.icon} />
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  Digital
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  {row.digital.label}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center rounded-lg bg-amber-50/50 dark:bg-amber-900/10 p-1.5">
                <StatusIcon type={row.wqn.icon} />
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                  WQN
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400">
                  {row.wqn.label}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
