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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 items-start">
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