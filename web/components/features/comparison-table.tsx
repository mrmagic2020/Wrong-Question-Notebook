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

const STATUS_LABELS: Record<'check' | 'cross' | 'partial', string> = {
  check: 'Supported',
  partial: 'Partially supported',
  cross: 'Not supported',
};

function StatusIcon({ type }: { type: 'check' | 'cross' | 'partial' }) {
  const srLabel = STATUS_LABELS[type];

  if (type === 'check') {
    return (
      <div
        className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center"
        role="img"
        aria-label={srLabel}
      >
        <Check
          className="w-3 h-3 text-green-600 dark:text-green-400"
          aria-hidden="true"
        />
      </div>
    );
  }
  if (type === 'partial') {
    return (
      <div
        className="w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center"
        role="img"
        aria-label={srLabel}
      >
        <Minus
          className="w-3 h-3 text-yellow-600 dark:text-yellow-400"
          aria-hidden="true"
        />
      </div>
    );
  }
  return (
    <div
      className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center"
      role="img"
      aria-label={srLabel}
    >
      <X
        className="w-3 h-3 text-red-500 dark:text-red-400"
        aria-hidden="true"
      />
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
              <th
                scope="col"
                className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-400 w-[28%]"
              >
                Feature
              </th>
              <th
                scope="col"
                className="text-center p-4 text-sm font-medium text-gray-600 dark:text-gray-400 w-[24%]"
              >
                Physical Notebook
              </th>
              <th
                scope="col"
                className="text-center p-4 text-sm font-medium text-gray-600 dark:text-gray-400 w-[24%]"
              >
                Digital Document
              </th>
              <th
                scope="col"
                className="text-center p-4 text-sm font-semibold text-amber-700 dark:text-amber-300 w-[24%] bg-amber-200/50 dark:bg-amber-900/20 rounded-t-2xl"
              >
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
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {row.physical.label}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex flex-col items-center gap-1">
                    <StatusIcon type={row.digital.icon} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {row.digital.label}
                    </span>
                  </div>
                </td>
                <td
                  className={
                    'p-4 bg-amber-200/30 dark:bg-amber-900/20' +
                    (i === rows.length - 1 ? ' rounded-b-2xl' : '')
                  }
                >
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
            className="rounded-xl border border-gray-200/60 dark:border-gray-800/60 p-4 space-y-2.5"
          >
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {row.feature}
            </h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <StatusIcon type={row.physical.icon} />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-14 shrink-0">
                  Physical
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {row.physical.label}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <StatusIcon type={row.digital.icon} />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-14 shrink-0">
                  Digital
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {row.digital.label}
                </span>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 px-2 py-1.5 -mx-2">
                <StatusIcon type={row.wqn.icon} />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 w-14 shrink-0">
                  WQN
                </span>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
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
