import React from 'react';
import { ImagePrompt, User } from '../types';
import { HeartIcon } from './icons/HeartIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';

interface ImageCardProps {
  image: ImagePrompt;
  onClick: () => void;
  currentUser: User | null;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onClick, currentUser }) => {
  
  const hasLiked = currentUser && image.likes.includes(currentUser.id);

  return (
    <div 
      className="relative overflow-hidden transition-all duration-300 ease-in-out border-2 rounded-xl cursor-pointer group bg-cyber-surface border-cyber-surface/50 hover:shadow-cyber-glow-lg hover:-translate-y-1 hover:border-cyber-pink/80 mb-6"
      onClick={onClick}
      style={{ breakInside: 'avoid' }}
    >
      <img
        src={image.image_url}
        alt={image.prompt.substring(0, 30)}
        className="object-cover w-full transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      
      <div className="absolute inset-0 flex flex-col justify-end transition-opacity duration-300 opacity-0 bg-gradient-to-t from-black/80 to-transparent group-hover:opacity-100">
        {/* Social Stats */}
        <div className="w-full p-4 pt-0">
          <div className="flex items-center justify-end gap-4 text-sm text-white">
              <div className="flex items-center gap-1.5 p-1.5 px-2.5 bg-black/40 rounded-full">
                  <HeartIcon className={`w-5 h-5 ${hasLiked ? 'text-cyber-pink' : ''}`} fill={hasLiked ? 'currentColor' : 'none'}/>
                  <span className="font-semibold">{image.likes.length}</span>
              </div>
              <div className="flex items-center gap-1.5 p-1.5 px-2.5 bg-black/40 rounded-full">
                  <ChatBubbleIcon className="w-5 h-5" />
                  <span className="font-semibold">{image.comments_count ?? 0}</span>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;