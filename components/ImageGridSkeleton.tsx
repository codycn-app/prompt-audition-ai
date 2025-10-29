import React from 'react';

const SkeletonCard: React.FC = () => (
    <div className="aspect-[4/5] bg-cyber-surface/50 rounded-xl shimmer-animation">
    </div>
);

const ImageGridSkeleton: React.FC = () => {
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: 18 }).map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </div>
    </div>
  );
};

export default ImageGridSkeleton;