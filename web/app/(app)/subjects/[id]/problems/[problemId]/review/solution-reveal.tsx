'use client';

import { Button } from '@/components/ui/button';
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import AssetPreview from './asset-preview';
import { SolutionRevealProps } from '@/lib/types';

export default function SolutionReveal({
  solutionText,
  solutionAssets,
  correctAnswer,
  problemType,
  isRevealed,
  onToggle,
}: SolutionRevealProps) {
  const hasSolution = solutionText || solutionAssets.length > 0;

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-card-foreground">Solution</h2>
        {hasSolution && (
          <Button onClick={onToggle} variant="secondary">
            {isRevealed ? 'Hide Solution' : 'Reveal Solution'}
          </Button>
        )}
      </div>

      {!hasSolution ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <span className="text-2xl">📝</span>
          </div>
          <p className="text-sm">No solution provided for this problem</p>
        </div>
      ) : isRevealed ? (
        <div className="space-y-4">
          {/* Correct Answer */}
          {correctAnswer !== undefined && correctAnswer !== null && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md p-4">
              <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                Correct Answer
              </h3>
              <div className="text-green-700 dark:text-green-300">
                {problemType === 'extended' ? (
                  <div className="prose max-w-none rich-text-content">
                    <RichTextDisplay content={String(correctAnswer)} />
                  </div>
                ) : (
                  <p className="font-mono text-lg">
                    {JSON.stringify(correctAnswer)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Solution Text */}
          {solutionText && (
            <div className="space-y-2">
              <div className="prose max-w-none rich-text-content">
                <RichTextDisplay content={solutionText} />
              </div>
            </div>
          )}

          {/* Solution Assets */}
          {solutionAssets.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Solution Assets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {solutionAssets.map((asset, index) => (
                  <AssetPreview key={index} asset={asset} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">
            Click "Reveal Solution" to view the solution
          </p>
        </div>
      )}
    </div>
  );
}
