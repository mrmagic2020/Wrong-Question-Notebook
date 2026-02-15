'use client';

import { BookOpen, CheckCircle2, Circle, XCircle } from 'lucide-react';

export function HeroAnimation() {
  return (
    <div className="hero-float relative w-full max-w-md mx-auto">
      {/* Notebook mockup container */}
      <div className="rounded-2xl border border-amber-200/60 dark:border-amber-900/40 bg-white dark:bg-stone-900 shadow-xl shadow-amber-900/5 dark:shadow-black/30 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50/80 dark:bg-amber-950/30 border-b border-amber-200/40 dark:border-amber-900/30">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          </div>
          <span className="text-xs font-medium text-amber-800/60 dark:text-amber-200/50 ml-1">
            Wrong Question Notebook
          </span>
        </div>

        {/* Content area with ruled lines */}
        <div className="relative p-4 space-y-3 bg-[repeating-linear-gradient(transparent,transparent_27px,#f5e6d3_27px,#f5e6d3_28px)] dark:bg-[repeating-linear-gradient(transparent,transparent_27px,#2a1f0e_27px,#2a1f0e_28px)]">
          {/* Subject card - slides in */}
          <div className="hero-slide-in-left flex items-center gap-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/40 px-3.5 py-2.5">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/15 dark:bg-blue-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 truncate">
                Mathematics
              </p>
              <p className="text-xs text-blue-600/70 dark:text-blue-400/60">
                12 problems
              </p>
            </div>
          </div>

          {/* Problem rows */}
          <div className="space-y-2 pl-1">
            {/* Problem 1 - mastered */}
            <div className="hero-slide-in-right flex items-center gap-2 rounded-lg px-2.5 py-2 bg-white/60 dark:bg-stone-800/40 border border-gray-100 dark:border-stone-700/50">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">
                Quadratic formula derivation
              </span>
              <span className="status-mastered text-[10px] flex-shrink-0">
                Mastered
              </span>
            </div>

            {/* Problem 2 - transitions from wrong to mastered */}
            <div className="hero-slide-in-right-delayed flex items-center gap-2 rounded-lg px-2.5 py-2 bg-white/60 dark:bg-stone-800/40 border border-gray-100 dark:border-stone-700/50">
              <div className="flex-shrink-0 relative w-4 h-4">
                <XCircle className="w-4 h-4 text-red-500 absolute inset-0 hero-status-wrong" />
                <CheckCircle2 className="w-4 h-4 text-green-500 absolute inset-0 hero-status-mastered" />
              </div>
              <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">
                Integration by parts
              </span>
              <div className="relative flex-shrink-0">
                <span className="status-wrong text-[10px] hero-badge-wrong absolute top-0 right-0">
                  Wrong
                </span>
                <span className="status-mastered text-[10px] hero-badge-mastered">
                  Mastered
                </span>
              </div>
            </div>

            {/* Problem 3 - needs review */}
            <div className="hero-slide-in-right-delayed-2 flex items-center gap-2 rounded-lg px-2.5 py-2 bg-white/60 dark:bg-stone-800/40 border border-gray-100 dark:border-stone-700/50">
              <Circle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">
                Taylor series expansion
              </span>
              <span className="status-needs-review text-[10px] flex-shrink-0">
                Review
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="hero-fade-in-delayed pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                Progress
              </span>
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                67%
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-stone-800 overflow-hidden">
              <div className="hero-progress-fill h-full rounded-full bg-gradient-to-r from-amber-400 to-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-amber-200/50 dark:bg-amber-800/30 hero-float-delayed" />
      <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-rose-200/50 dark:bg-rose-800/30 hero-float-delayed-2" />
    </div>
  );
}
