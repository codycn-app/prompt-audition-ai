import React from 'react';
import { ImagePrompt, User } from '../types';
import ImageCard from './ImageCard';

interface ImageGridProps {
  images: ImagePrompt[];
  onImageClick: (image: ImagePrompt) => void;
  currentUser: User | null;
}

const ImageGrid: React.FC<ImageGridProps> = ({ images, onImageClick, currentUser }) => {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h3 className="text-xl font-semibold text-cyber-on-surface">Không tìm thấy kết quả</h3>
        <p className="mt-2 text-cyber-on-surface-secondary">Hãy thử một từ khóa khác hoặc thêm một ảnh mới!</p>
      </div>
    );
  }

  return (
    <div className="gap-6 space-y-6 columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6">
      {images.map((image) => (
        <ImageCard 
          key={image.id} 
          image={image} 
          onClick={() => onImageClick(image)}
          currentUser={currentUser}
        />
      ))}
    </div>
  );
};

export default ImageGrid;