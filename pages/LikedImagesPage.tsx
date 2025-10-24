import React from 'react';
import { ImagePrompt, User } from '../types';
import ImageGrid from '../components/ImageGrid';
import { HeartIcon } from '../components/icons/HeartIcon';

interface LikedImagesPageProps {
  images: ImagePrompt[];
  currentUser: User | null;
  onImageClick: (image: ImagePrompt) => void;
}

const LikedImagesPage: React.FC<LikedImagesPageProps> = ({ images, currentUser, onImageClick }) => {
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h3 className="text-xl font-semibold text-cyber-on-surface">Vui lòng đăng nhập</h3>
        <p className="mt-2 text-cyber-on-surface-secondary">Bạn cần đăng nhập để xem các ảnh đã thích.</p>
      </div>
    );
  }

  const likedImages = images.filter(image => image.likes.includes(currentUser.id))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-full py-8 px-4 sm:px-6 lg:px-8 animate-fade-in-scale">
      <h1 className="text-3xl font-bold font-oxanium text-cyber-on-surface mb-6 text-center sm:text-left">Bộ sưu tập đã thích</h1>
      {likedImages.length > 0 ? (
        <div className="p-4 sm:p-0">
          <ImageGrid 
            images={likedImages} 
            onImageClick={onImageClick}
            currentUser={currentUser}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center border-2 rounded-lg bg-cyber-surface/30 border-cyber-pink/20">
            <HeartIcon className="w-16 h-16 mb-4 text-cyber-pink/50"/>
            <h3 className="text-xl font-semibold text-cyber-on-surface">Chưa có ảnh nào</h3>
            <p className="mt-2 text-cyber-on-surface-secondary">Thả tim vào một ảnh để thêm vào bộ sưu tập của bạn!</p>
        </div>
      )}
    </div>
  );
};

export default LikedImagesPage;