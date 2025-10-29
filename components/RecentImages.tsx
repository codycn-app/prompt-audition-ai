import React from 'react';
import { ImagePrompt } from '../types';
import RecentImageCard from './RecentImageCard';

interface RecentImagesProps {
  images: ImagePrompt[];
  onImageClick: (image: ImagePrompt) => void;
}

const RecentImages: React.FC<RecentImagesProps> = ({ images, onImageClick }) => {
  if (images.length === 0) {
    return null; // Don't render if there are no recent images
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-2">
      <h2 className="text-xl font-bold font-oxanium text-cyber-on-surface mb-4">Mới nhất</h2>
      <div className="flex pb-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 space-x-4 overflow-x-auto custom-scrollbar">
        {images.map(image => (
          <RecentImageCard key={image.id} image={image} onImageClick={onImageClick} />
        ))}
      </div>
    </div>
  );
};

export default RecentImages;
