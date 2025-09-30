'use client';

interface SolutionAsset {
  path: string;
  kind?: 'image' | 'pdf';
}

interface SolutionRevealProps {
  solutionText?: string;
  solutionAssets: SolutionAsset[];
  correctAnswer?: any;
  problemType?: string;
  isRevealed: boolean;
  onToggle: () => void;
}

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
          <button
            onClick={onToggle}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            {isRevealed ? 'Hide Solution' : 'Reveal Solution'}
          </button>
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
                  <div className="prose max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: String(correctAnswer),
                      }}
                    />
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
              <h3 className="font-medium">Solution</h3>
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: solutionText }} />
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

// Import AssetPreview component
import AssetPreview from './asset-preview';
