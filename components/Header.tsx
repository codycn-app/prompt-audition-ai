import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon } from './icons/PlusIcon';
import UserMenu from './UserMenu';
import { ImagePrompt, Category } from '../types';
import { Page } from '../App';
import { CrownIcon } from './icons/CrownIcon';
import { HeartIcon } from './icons/HeartIcon';
import { TagIcon } from './icons/TagIcon';

interface HeaderProps {
  onCategorySelect: (id: number | 'all') => void;
  categories: Category[];
  selectedCategoryId: number | 'all';
  onAddNew: () => void;
  onLogin: () => void;
  onSignup: () => void;
  setCurrentPage: (page: Page) => void;
  images: ImagePrompt[];
}

const Header: React.FC<HeaderProps> = ({ onCategorySelect, categories, selectedCategoryId, onAddNew, onLogin, onSignup, setCurrentPage, images }) => {
  const { currentUser } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex flex-col items-center justify-between w-full p-4 border-b bg-cyber-black/70 backdrop-blur-xl border-cyber-pink/20 gap-4">
      <div className="flex items-center justify-between w-full">
        <h1 
            onClick={() => {
              onCategorySelect('all');
              setCurrentPage('home');
            }}
            className="font-oxanium font-semibold text-2xl md:text-3xl tracking-wider text-transparent bg-gradient-to-r from-cyber-pink via-cyber-cyan to-cyber-pink bg-clip-text animate-background-pan cursor-pointer"
            style={{ backgroundSize: '200% auto', textShadow: '0 0 15px rgba(255, 0, 230, 0.4)' }}>
          Prompt Audition AI
        </h1>
        <div className="md:hidden">
            {currentUser ? (
              <UserMenu images={images} setCurrentPage={setCurrentPage} />
            ) : (
              // This placeholder prevents the title from shifting when user is logged out.
              // Effectively removes the login button from the top right on mobile.
              <div className="w-10 h-10"></div>
            )}
        </div>
        <div className="hidden md:flex items-center space-x-2 sm:space-x-4">
          {currentUser && (
            <button
                onClick={() => setCurrentPage('liked-images')}
                className="flex items-center gap-2 px-3 py-2.5 transition-colors duration-300 border rounded-lg bg-cyber-surface border-cyber-pink/30 hover:border-cyber-pink/80 hover:bg-cyber-pink/10 focus:outline-none focus:ring-2 focus:ring-cyber-pink active:scale-95"
                aria-label="Ảnh đã thích"
            >
                <HeartIcon className="w-5 h-5 text-cyber-pink" />
            </button>
          )}
          <button
              onClick={() => setCurrentPage('leaderboard')}
              className="flex items-center gap-2 px-3 py-2.5 transition-colors duration-300 border rounded-lg bg-cyber-surface border-cyber-cyan/30 hover:border-cyber-cyan/80 hover:bg-cyber-cyan/10 focus:outline-none focus:ring-2 focus:ring-cyber-cyan active:scale-95"
              aria-label="Bảng xếp hạng"
          >
              <CrownIcon className="w-5 h-5 text-cyber-cyan" />
          </button>
          
          {currentUser ? (
            <>
              <button
                onClick={onAddNew}
                className="relative inline-flex items-center px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 border-2 border-transparent rounded-lg shadow-lg outline-none bg-gradient-to-r from-cyber-pink to-cyber-cyan group hover:shadow-cyber-glow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-cyber-black focus:ring--pink active:scale-95"
              >
                <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                <span>Thêm mới</span>
              </button>
              <UserMenu images={images} setCurrentPage={setCurrentPage} />
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button onClick={onLogin} className="px-5 py-2.5 text-sm font-medium transition-colors rounded-lg text-cyber-on-surface hover:bg-cyber-surface/50 active:scale-95">Đăng nhập</button>
              <button onClick={onSignup} className="px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 rounded-lg shadow-lg bg-gradient-to-r from-cyber-pink to-cyber-cyan hover:shadow-cyber-glow active:scale-95">Đăng ký</button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center w-full pb-1 overflow-x-auto custom-scrollbar md:justify-center">
        <div className="flex items-center flex-shrink-0 p-1 space-x-2 rounded-lg bg-cyber-surface/50">
            <button
              onClick={() => onCategorySelect('all')}
              className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-300 outline-none focus:ring-2 focus:ring-cyber-pink focus:ring-offset-2 focus:ring-offset-cyber-black ${selectedCategoryId === 'all' ? 'bg-gradient-to-r from-cyber-pink to-cyber-cyan text-white shadow-cyber-glow' : 'bg-transparent text-cyber-on-surface-secondary hover:bg-cyber-black/20 hover:text-cyber-on-surface'}`}
            >
              Tất cả
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => onCategorySelect(cat.id)}
                className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-300 outline-none focus:ring-2 focus:ring-cyber-pink focus:ring-offset-2 focus:ring-offset-cyber-black ${selectedCategoryId === cat.id ? 'bg-gradient-to-r from-cyber-pink to-cyber-cyan text-white shadow-cyber-glow' : 'bg-transparent text-cyber-on-surface-secondary hover:bg-cyber-black/20 hover:text-cyber-on-surface'}`}
              >
                {cat.name}
              </button>
            ))}
        </div>
      </div>
    </header>
  );
};

export default Header;