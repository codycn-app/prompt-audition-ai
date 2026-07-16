import React from 'react';
import { ImagePrompt } from '../types';

interface ImageCardProps {
  image: ImagePrompt;
  onClick: () => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onClick }) => {

  // Calculate object-position based on crop data.
  // This ensures the user's selected focal point is centered in the thumbnail.
  const getObjectPosition = () => {
    if (!image.thumbnail_crop_data || !image.original_width || !image.original_height) {
      return '50% 50%'; // Default to center if no crop data
    }
    const { x, y, width, height } = image.thumbnail_crop_data;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    const positionX = (centerX / image.original_width) * 100;
    const positionY = (centerY / image.original_height) * 100;

    return `${positionX}% ${positionY}%`;
  };

  return (
    <div 
      // Force a 3:4 aspect ratio on all cards. This creates a uniform grid and solves the layout problem.
      className="aspect-[3/4] transition-all duration-300 ease-in-out border-2 rounded-xl cursor-pointer group bg-cyber-surface border-cyber-surface/50 hover:shadow-cyber-glow-lg hover:-translate-y-1 hover:border-cyber-pink/80"
      onClick={onClick}
    >
      {/* Wrapper to constrain overlay to image dimensions and clip the scaling image */}
      <div className="relative w-full h-full overflow-hidden rounded-[10px]">
        <img
          src={image.image_url}
          alt={image.prompt.substring(0, 30)}
          className="block object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          style={{ objectPosition: getObjectPosition() }}
          loading="lazy"
        />
        
      </div>
    </div>
  );
};

export default ImageCard;
