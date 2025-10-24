import React from 'react';

const SkeletonCard: React.FC<{height: number}> = ({ height }) => (
    <div className="bg-cyber-surface/50 rounded-xl shimmer-animation" style={{ breakInside: 'avoid', height: `${height}px` }}>
    </div>
);

const ImageGridSkeleton: React.FC = () => {
  const heights = [250, 320, 280, 350, 300, 220, 330, 260];
  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <style>{`
            @keyframes shimmer {
                0% { background-position: -1000px 0; }
                100% { background-position: 1000px 0; }
            }
            .shimmer-animation {
                animation: shimmer 2s infinite linear;
                background: linear-gradient(to right, #1A1A1A 25%, #2A2A2A 50%, #1A1A1A 75%);
                background-size: 2000px 100%;
            }
        `}</style>
        <div className="gap-6 space-y-6 columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6">
            {Array.from({ length: 18 }).map((_, index) => (
                <SkeletonCard key={index} height={heights[index % heights.length]}/>
            ))}
        </div>
    </div>
  );
};

export default ImageGridSkeleton;
