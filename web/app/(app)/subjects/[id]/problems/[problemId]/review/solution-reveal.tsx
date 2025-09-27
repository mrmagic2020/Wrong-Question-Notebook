'use client';

interface SolutionAsset {
  path: string;
  kind?: 'image' | 'pdf';
}

interface SolutionRevealProps {
  solutionText?: string;
  solutionAssets: SolutionAsset[];
  isRevealed: boolean;
  onToggle: () => void;
}

export default function SolutionReveal({
  solutionText,
  solutionAssets,
  isRevealed,
  onToggle,
}: SolutionRevealProps) {
  const hasSolution = solutionText || solutionAssets.length > 0;

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Solution</h2>
        {hasSolution && (
          <button
            onClick={onToggle}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            {isRevealed ? 'Hide Solution' : 'Reveal Solution'}
          </button>
        )}
      </div>

      {!hasSolution ? (
        <div className="text-center py-8 text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">📝</span>
          </div>
          <p className="text-sm">No solution provided for this problem</p>
        </div>
      ) : isRevealed ? (
        <div className="space-y-4">
          {/* Solution Text */}
          {solutionText && (
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: solutionText }} />
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
        <div className="text-center py-8 text-gray-500">
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
