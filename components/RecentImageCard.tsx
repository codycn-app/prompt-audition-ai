import React from 'react';
import { ImagePrompt } from '../types';

interface RecentImageCardProps {
  image: ImagePrompt;
  onImageClick: (image: ImagePrompt) => void;
}

const RecentImageCard: React.FC<RecentImageCardProps> = ({ image, onImageClick }) => {
  return (
    <div
      onClick={() => onImageClick(image)}
      className="relative w-32 h-48 overflow-hidden rounded-lg cursor-pointer flex-shrink-0 group transition-all duration-300 ease-in-out hover:shadow-cyber-glow hover:-translate-y-1"
    >
      <img
        src={image.image_url}
        alt={image.title}
        loading="lazy"
        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-2">
        <h3 className="text-xs font-semibold text-white truncate">{image.title}</h3>
      </div>
    </div>
  );
};

export default RecentImageCard;
